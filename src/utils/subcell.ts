import {beginCell, Cell, Slice} from "@ton/core"
import {repeat} from "./tricks"

export function subslice(args: {
    cell: Cell
    offsetBits: number
    offsetRefs: number
    bits: number
    refs: number
}): Slice {
    const s = args.cell.beginParse()
    const b = beginCell()

    // Copy bits and refs
    b.storeBits(s.loadBits(args.bits + args.offsetBits))
    repeat(args.refs + args.offsetRefs, () => b.storeRef(s.loadRef()))

    const s2 = b.endCell().beginParse()

    // Skip bits and refs
    s2.skip(args.offsetBits)
    repeat(args.offsetRefs, () => s2.loadRef())

    return s2
}
