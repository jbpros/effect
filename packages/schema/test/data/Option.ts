import * as O from "@fp-ts/data/Option"
import * as _ from "@fp-ts/schema/data/Option"
import * as D from "@fp-ts/schema/Decoder"
import * as E from "@fp-ts/schema/Encoder"
import * as G from "@fp-ts/schema/Guard"
import * as P from "@fp-ts/schema/Pretty"
import * as S from "@fp-ts/schema/Schema"
import * as Util from "@fp-ts/schema/test/util"

describe.concurrent("Option", () => {
  it("fromNullable. property tests", () => {
    Util.property(_.fromNullable(S.number))
  })

  it("option. guard. direct", () => {
    const schema = _.option(S.number)
    const guard = G.guardFor(schema)
    expect(guard.is(O.none)).toEqual(true)
    expect(guard.is(O.some(1))).toEqual(true)
    expect(guard.is(O.some("a"))).toEqual(false)
  })

  it("fromNullable. decoder", () => {
    const schema = _.fromNullable(S.number)
    const decoder = D.decoderFor(schema)
    expect(decoder.decode(undefined)).toEqual(D.success(O.none))
    expect(decoder.decode(null)).toEqual(D.success(O.none))
    expect(decoder.decode(1)).toEqual(D.success(O.some(1)))

    Util.expectFailureTree(
      decoder,
      {},
      `3 error(s) found
├─ union member
│  └─ {} did not satisfy is(undefined)
├─ union member
│  └─ {} did not satisfy isEqual(null)
└─ union member
   └─ {} did not satisfy is(number)`
    )
  })

  it("fromNullable. encoder", () => {
    const schema = _.fromNullable(S.number)
    const encoder = E.encoderFor(schema)
    expect(encoder.encode(O.none)).toEqual(null)
  })

  it("option. Pretty", () => {
    const schema = _.option(S.number)
    const pretty = P.prettyFor(schema)
    expect(pretty.pretty(O.none)).toEqual("none")
    expect(pretty.pretty(O.some(1))).toEqual("some(1)")
  })
})
