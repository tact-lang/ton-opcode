import { Slice } from "ton-core";
import { CP0Auto } from "./opcodes";
import { OpCode } from "./opcodes.gen";

const codepage = CP0Auto;

export function loadOpcode(sc: Slice) {
    let opCode = '';
    while (sc.remainingBits > 0) {

        // Load next bit
        let opCodePart = sc.loadBit();
        opCode += opCodePart ? '1' : '0'

        // Find opcode in codepage
        // Edit maxOccurencies for debugging purposes
        let matches = codepage.find(opCode, 2);
        if (matches.length > 1) {
            continue;
        }
        if (matches.length == 1 && opCode.length !== matches[0].length) {
            continue;
        }
        if (matches.length == 0) {
            return { ok: false, read: opCode } as const;
        }

        // Load opcode
        let op = codepage.getOp(opCode)!!;

        // Resolve real opcode
        let resolvedOpcode: OpCode;
        if (typeof op === 'function') {
            resolvedOpcode = op(sc);
        } else {
            resolvedOpcode = op;
        }

        return { ok: true, read: resolvedOpcode } as const;
    }

    return { ok: false, read: opCode } as const;
}