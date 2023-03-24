import { beginCell, Cell } from "ton-core";
import { loadOpcode } from "../codepage/loadOpcode";
import { OpCode } from "../codepage/opcodes.gen";

export type DecompiledOpCode = OpCode | { code: 'unknown', data: Cell };
export type DecompiledInstruction = { op: DecompiledOpCode };

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
                    }
                });
                break;
            } else {
                throw Error('Unknown opcode: b' + opcode.read);
            }
        }

        // Update state
        let letNOffset = sco + scl - sc.remainingBits;
        scl = sc.remainingBits;
        sco = letNOffset;

        // Push opcode to result
        result.push({ op: opcode.read });

        // Implicit jump
        if (sc.remainingBits === 0 && sc.remainingRefs > 0) {
            sc = sc.loadRef().beginParse();
            scl = sc.remainingBits;
            sco = 0;
        }
    }

    return result;
}