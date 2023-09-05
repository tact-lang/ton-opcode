import { beginCell, Cell, Slice } from "@ton/core";

export function subcell(args: { cell: Cell, offsetBits: number, offsetRefs: number, bits: number, refs: number }): Cell {
    let s = args.cell.beginParse();
    let b = beginCell();

    // Skip bits and refs
    s.skip(args.offsetBits);
    for (let i = 0; i < args.offsetRefs; i++) {
        s.loadRef();
    }

    // Copy bits and refs
    b.storeBits(s.loadBits(args.bits));
    for (let i = 0; i < args.refs; i++) {
        b.storeRef(s.loadRef());
    }

    return b.endCell();
}

export function subslice(args: { cell: Cell, offsetBits: number, offsetRefs: number, bits: number, refs: number }): Slice {
    let s = args.cell.beginParse();
    let b = beginCell();

    // Copu bits and refs
    b.storeBits(s.loadBits(args.bits + args.offsetBits));
    for (let i = 0; i < args.refs + args.offsetRefs; i++) {
        b.storeRef(s.loadRef());
    }

    let s2 = b.endCell().beginParse();

    // Skip bits and refs
    s2.skip(args.offsetBits);
    for (let i = 0; i < args.offsetRefs; i++) {
        s2.loadRef();
    }

    return s2;
}