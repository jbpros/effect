import type * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type * as Scope from "effect/Scope"
import * as Stream from "effect/Stream"
import * as AtLeastOnceStorage from "../AtLeastOnceStorage.js"
import type { Envelope } from "../Envelope.js"
import * as MessageState from "../MessageState.js"
import type * as RecipientBehaviour from "../RecipientBehaviour.js"
import * as RecipientBehaviourContext from "../RecipientBehaviourContext.js"
import * as Sharding from "../Sharding.js"

/** @internal */
export function runPendingMessageSweeperScoped(
  interval: Duration.Duration
): Effect.Effect<void, never, AtLeastOnceStorage.AtLeastOnceStorage | Sharding.Sharding | Scope.Scope> {
  return Effect.flatMap(AtLeastOnceStorage.AtLeastOnceStorage, (storage) =>
    pipe(
      Sharding.getAssignedShardIds,
      Effect.flatMap((shardIds) =>
        pipe(
          storage.sweepPending(shardIds),
          Stream.mapEffect((envelope) => Sharding.sendMessageToLocalEntityManagerWithoutRetries(envelope)),
          Stream.runDrain
        )
      ),
      Effect.delay(interval),
      Effect.catchAllCause(Effect.logError),
      Effect.forever,
      Effect.forkScoped,
      Effect.asVoid
    ))
}

/** @internal */
export function atLeastOnceRecipientBehaviour<Msg extends Envelope.AnyMessage, R>(
  fa: RecipientBehaviour.RecipientBehaviour<Msg, R>
): RecipientBehaviour.RecipientBehaviour<Msg, R | AtLeastOnceStorage.AtLeastOnceStorage> {
  return Effect.gen(function*(_) {
    const storage = yield* _(AtLeastOnceStorage.AtLeastOnceStorage)
    const entityId = yield* _(RecipientBehaviourContext.entityId)
    const shardId = yield* _(RecipientBehaviourContext.shardId)
    const recipientType = yield* _(RecipientBehaviourContext.entity)
    const offer = yield* _(fa)
    return <A extends Msg>(envelope: Envelope<A>) =>
      pipe(
        storage.upsert<A>(recipientType as any, shardId, entityId, envelope),
        Effect.zipRight(
          pipe(
            offer(envelope),
            Effect.tap(MessageState.match({
              onAcknowledged: () => Effect.void,
              onProcessed: () => storage.markAsProcessed<A>(recipientType as any, shardId, entityId, envelope)
            }))
          )
        )
      )
  })
}
