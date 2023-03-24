import { beginCell, Cell, Slice } from "ton-core";
import { loadOpcode } from "../codepage/loadOpcode";
import { OpCode } from "../codepage/opcodes.gen";
import { Maybe } from "../utils/maybe";

export type DecompiledOpCode = OpCode | { code: 'unknown', data: Cell };
export type DecompiledInstruction = {
    op: DecompiledOpCode,
    offset: number,
    length: number
};

export function decompile(args: { src: Cell | Slice | Buffer, srcOffset?: Maybe<number>, allowUnknown?: boolean }): DecompiledInstruction[] {

    // Result collection
    let result: DecompiledInstruction[] = [];

    // Load slice
    let sc: Slice;
    if (Buffer.isBuffer(args.src)) {
        sc = Cell.fromBoc(args.src)[0].beginParse();
    } else if (args.src instanceof Cell) {
        sc = args.src.beginParse();
    } else {
        sc = args.src;
    }

    // Prepare offset
    let sco = args.srcOffset || 0;
    if (args.srcOffset && args.srcOffset > 0) {
        sc.skip(args.srcOffset);
    }

    // Prepare remaining tracker
    let scl = sc.remainingBits;

    while (sc.remainingBits > 0) {

        // Load opcode
        const opcode = loadOpcode(sc);

        // Update state
        let currentOffset = sco; // Persisted offset before reading opcode
        let currentLength = scl - sc.remainingBits; // Check difference in remaining bits to calculate opcode length
        scl -= currentLength;
        sco += currentLength;

        // Failed case
        if (!opcode.ok) {
            if (args.allowUnknown) {
                let fullCell = beginCell();
                for (let bit of Array.from(opcode.read).map(a => a == '0' ? false : true)) {
                    fullCell.storeBit(bit);
                }
                fullCell.storeSlice(sc);
                result.push({
                    op: {
                        code: 'unknown',
                        data: fullCell.endCell()
                    },
                    offset: currentOffset,
                    length: currentLength
                });
                break;
            } else {
                throw Error('Unknown opcode: b' + opcode.read);
            }
        }

        // Push opcode to result
        result.push({
            op: opcode.read,
            offset: currentOffset,
            length: currentLength
        });

        // Implicit jump
        if (sc.remainingBits === 0 && sc.remainingRefs > 0) {
            sc = sc.loadRef().beginParse();
            scl = sc.remainingBits;
            sco = 0;
        }
    }

    return result;
}