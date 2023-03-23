import { beginCell, Cell } from "ton-core";
import { CP0Auto } from "../codepage/opcodes";
import { OpCode } from "../codepage/opcodes.gen";

const codepage = CP0Auto;

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
    let opCode = '';
    while (sc.remainingBits > 0) {

        // Load next bit
        let opCodePart = sc.loadBit();
        opCode += opCodePart ? '1' : '0'

        // Find opcode in codepage
        let matches = codepage.find(opCode);
        if (matches.length > 1) {
            continue;
        }
        if (matches.length == 1 && opCode.length !== matches[0].length) {
            continue;
        }
        if (matches.length == 0) {
            if (args.allowUnknown) {
                let fullCell = beginCell();
                for (let bit of Array.from(opCode).map(a => a == '0' ? false : true)) {
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
                throw Error('Unknown opcode: b' + opCode);
            }
        }

        // Load opcode
        let op = codepage.getOp(opCode)!!;

        // Update state
        let letNOffset = sco + scl - sc.remainingBits;
        scl = sc.remainingBits;
        sco = letNOffset;
        opCode = '';

        // Resolve real opcode
        let resolvedOpcode: OpCode;
        if (typeof op === 'function') {
            resolvedOpcode = op(sc);
        } else {
            resolvedOpcode = op;
        }

        // Push opcode to result
        result.push({
            op: resolvedOpcode
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