import { Cell } from "ton-core";
import { isOpCodeWithArgs, OpCode } from "../codepage/opcodes.gen";
import { opcodeToString } from "../codepage/opcodeToString";
import { Writer } from "../utils/Writer";
import { decompile } from "./decompiler";

function decompileCell(args: { src: Buffer | Cell, allowUnknown?: boolean, writer: Writer }) {
    const writer = args.writer;
    const opcodes = decompile({
        src: args.src,
        allowUnknown: args.allowUnknown
    });
    for (const op of opcodes) {

        // Special cases for continuations
        if (op.op.code === 'PUSHCONT'
            || op.op.code === 'CALLREF') {
            let c = op.op.args[0];
            writer.append('<{');
            writer.inIndent(() => {
                decompileCell({
                    src: c,
                    allowUnknown: args.allowUnknown,
                    writer: writer
                });
            })
            writer.append('}> ' + op.op.code);
            continue;
        }

        // Special cases for unknown opcode
        if (op.op.code === 'unknown') {
            writer.append('##unknown');
            continue;
        }

        // All remaining opcodes
        writer.append(opcodeToString(op.op));
    }
}

export function decompileAll(args: { src: Buffer | Cell, allowUnknown?: boolean }) {
    let writer = new Writer();
    decompileCell({
        src: args.src,
        allowUnknown: args.allowUnknown,
        writer: writer
    });
    return writer.end();
}