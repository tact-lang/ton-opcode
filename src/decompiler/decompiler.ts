import { beginCell, Cell } from "ton-core";
import { loadOpcode } from "../codepage/loadOpcode";
import { OpCode } from "../codepage/opcodes.gen";

export type DecompiledOpCode = OpCode | { code: 'unknown', data: Cell };
export type DecompiledInstruction = {
    op: DecompiledOpCode,
    offset: number,
    length: number
};

export function decompile(args: { src: Cell | Buffer, allowUnknown?: boolean }): DecompiledInstruction[] {

    // Load cell
    let cell: Cell;
    if (Buffer.isBuffer(args.src)) {
        cell = Cell.fromBoc(args.src)[0];
    } else {
        cell = args.src;
    }

    // Result collection
    let result: DecompiledInstruction[] = [];

    // Parse cell
    let sc = cell.beginParse();
    let scl = sc.remainingBits;
    let sco = 0;
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