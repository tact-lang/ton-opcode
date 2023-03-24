import { OpCode } from "../codepage/opcodes.gen";
import { opcodeToString } from "../codepage/opcodeToString";

export type Printer = (src: string | { op: OpCode, hash: string, offset: number, length: number }, indent: number) => string;

export function createTextPrinter(indentWidth: number): Printer {
    return (src, indent) => {
        if (typeof src === 'string') {
            return ' '.repeat(indentWidth * indent) + src;
        } else {
            return ' '.repeat(indentWidth * indent) + opcodeToString(src.op);
        }
    };
}