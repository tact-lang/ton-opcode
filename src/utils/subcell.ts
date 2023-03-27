import { beginCell, Cell } from "ton-core";

export function subcell(args: { cell: Cell, bits: number, refs: number }): Cell {
    let s = args.cell.beginParse();
    let b = beginCell();

    // Copy bits and refs
    b.storeBits(s.loadBits(args.bits));
    for (let i = 0; i < args.refs; i++) {
        b.storeRef(s.loadRef());
    }

    return b.endCell();
}