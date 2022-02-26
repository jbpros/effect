import type { LazyArg } from "../../../data/Function"
import { AtomicReference } from "../../../support/AtomicReference"
import type { UIO } from "../../Effect"
import { Effect } from "../../Effect"
import { Atomic } from "../Atomic"
import type { Ref } from "../definition"

/**
 * Creates a new `Ref` with the specified value.
 *
 * @tsplus static ets/XRefOps make
 */
export function make<A>(value: LazyArg<A>, __tsplusTrace?: string): UIO<Ref<A>> {
  return Effect.succeed(unsafeMake(value()))
}

/**
 * @tsplus static ets/XRefOps unsafeMake
 */
export function unsafeMake<A>(value: A): Atomic<A> {
  return new Atomic(new AtomicReference(value))
}
