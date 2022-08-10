/**
 * Zips the two streams so that when a value is emitted by either of the two
 * streams, it is combined with the latest value from the other stream to
 * produce a result.
 *
 * Note: tracking the latest value is done on a per-chunk basis. That means
 * that emitted elements that are not the last value in chunks will never be
 * used for zipping.
 *
 * @tsplus static effect/core/stream/Stream.Aspects zipWithLatest
 * @tsplus pipeable effect/core/stream/Stream zipWithLatest
 */
export function zipWithLatest<R2, E2, A2, A, A3>(
  that: Stream<R2, E2, A2>,
  f: (a: A, a2: A2) => A3
) {
  return <R, E>(self: Stream<R, E, A>): Stream<R | R2, E | E2, A3> =>
    Stream.fromPull(
      Do(($) => {
        const left = $(self.toPull.map(pullNonEmpty))
        const right = $(that.toPull.map(pullNonEmpty))
        return $(
          Stream.fromEffectMaybe(
            left.raceWith<
              R,
              Maybe<E>,
              Chunk<A>,
              R2,
              Maybe<E2>,
              Chunk<A2>,
              never,
              Maybe<E | E2>,
              Tuple<[Chunk<A>, Chunk<A2>, boolean]>,
              never,
              Maybe<E | E2>,
              Tuple<[Chunk<A>, Chunk<A2>, boolean]>
            >(
              right,
              (leftDone, rightFiber) =>
                Effect.done(leftDone).zipWith(rightFiber.join, (left, right) =>
                  Tuple(left, right, true)),
              (rightDone, leftFiber) =>
                Effect.done(rightDone).zipWith(leftFiber.join, (right, left) =>
                  Tuple(left, right, false))
            )
          )
            .flatMap(({ tuple: [l, r, leftFirst] }) =>
              Stream.fromEffect(
                Ref.make(Tuple(l.unsafeGet(l.size - 1), r.unsafeGet(r.size - 1)))
              ).flatMap(
                (latest) =>
                  Stream.fromChunk(
                    leftFirst
                      ? r.map((a2) =>
                        f(l.unsafeGet(l.size - 1), a2)
                      )
                      : l.map((a) =>
                        f(a, r.unsafeGet(r.size - 1))
                      )
                  ) +
                  Stream.repeatEffectMaybe(left)
                    .mergeEither(Stream.repeatEffectMaybe(right))
                    .mapEffect((either) =>
                      either.fold(
                        (leftChunk) =>
                          latest.modify(({ tuple: [_, rightLatest] }) =>
                            Tuple(
                              leftChunk.map((a) => f(a, rightLatest)),
                              Tuple(leftChunk.unsafeGet(leftChunk.size - 1), rightLatest)
                            )
                          ),
                        (rightChunk) =>
                          latest.modify(({ tuple: [leftLatest, _] }) =>
                            Tuple(
                              rightChunk.map((a2) => f(leftLatest, a2)),
                              Tuple(leftLatest, rightChunk.unsafeGet(rightChunk.size - 1))
                            )
                          )
                      )
                    )
                    .flatMap((chunk) => Stream.fromChunk(chunk))
              )
            )
            .toPull
        )
      })
    )
}

function pullNonEmpty<R, E, A>(
  pull: Effect<R, Maybe<E>, Chunk<A>>
): Effect<R, Maybe<E>, Chunk<A>> {
  return pull.flatMap((chunk) => chunk.isEmpty ? pullNonEmpty(pull) : Effect.succeed(chunk))
}
