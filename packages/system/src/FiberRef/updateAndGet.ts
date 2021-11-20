// ets_tracing: off

import * as Tp from "../Collections/Immutable/Tuple"
import { modify } from "./modify"

/**
 * Atomically modifies the `FiberRef` with the specified function and returns
 * the result.
 */
export function updateAndGet<A>(f: (a: A) => A) {
  return modify<A, A>((v) => {
    const result = f(v)
    return Tp.tuple(result, result)
  })
}
