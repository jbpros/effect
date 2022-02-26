import type { Effect } from "../../../Effect"
import type { XSynchronized } from "../definition"

/**
 * Reads the value from the `XRef.Synchronized`.
 *
 * @tsplus fluent ets/XSynchronized get
 */
export function get<RA, RB, EA, EB, A, B>(
  self: XSynchronized<RA, RB, EA, EB, A, B>,
  __tsplusTrace?: string
): Effect<RB, EB, B> {
  return self._get
}
