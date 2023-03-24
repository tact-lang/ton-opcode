import { beginCell, BitReader, Cell, Dictionary, DictionaryValue } from "ton-core";
import { opcodeToString } from "../codepage/opcodeToString";
import { Maybe } from "../utils/maybe";
import { Writer } from "../utils/Writer";
import { decompile } from "./decompiler";
import { knownMethods } from "./knownMethods";
import { createTextPrinter, Printer } from "./printer";

function decompileCell(args: {
    src: Cell,
    srcOffset: number,
    root: boolean,
    writer: Writer,
    printer: Printer,
    callRefExtractor?: (ref: Cell) => string
}) {
    const printer = args.printer;
    const hash = args.src.hash().toString('hex');
    const writer = args.writer;
    const opcodes = decompile({
        src: args.src,
        srcOffset: args.srcOffset,
        allowUnknown: false
    });

    // Check if we have a default opcodes of func output
    if (args.root && opcodes.length === 4 && opcodes[0].op.code === 'SETCP'
        && opcodes[1].op.code === 'DICTPUSHCONST'
        && opcodes[2].op.code === 'DICTIGETJMPZ'
        && opcodes[3].op.code === 'THROWARG') {

        // Load dictionary
        let dictKeyLen = opcodes[1].op.args[0];
        let dictCell = opcodes[1].op.args[1];
        let dict = Dictionary.loadDirect<number, { offset: number, cell: Cell }>(Dictionary.Keys.Int(dictKeyLen), createCodeCell(), dictCell);

        // Extract all methods
        let unknownIndex = 0;
        let extracted = new Map<string, { ref: boolean, rendered: string, src: Cell, srcOffset: number }>();
        let callRefs = new Map<string, string>();
        function extract(cell: Cell) {

            // Check if we have a call ref
            let k = cell.hash().toString('hex');
            if (callRefs.has(k)) {
                return callRefs.get(k)!;
            }

            // Add name to a map and assign name
            let name = '?fun_' + (unknownIndex++);
            callRefs.set(k, name);

            // Render cell
            let w = new Writer();
            w.inIndent(() => {
                w.inIndent(() => {
                    decompileCell({
                        src: cell,
                        srcOffset: 0,
                        root: false,
                        writer: w,
                        callRefExtractor: extract,
                        printer: args.printer
                    });
                });
            });
            extracted.set(name, { ref: true, rendered: w.end(), src: cell, srcOffset: 0 });
            return name;
        }
        for (let [key, value] of dict) {
            let name = knownMethods[key] || '?fun_' + (unknownIndex++);
            let w = new Writer();
            w.inIndent(() => {
                w.inIndent(() => {
                    decompileCell({
                        src: value.cell,
                        srcOffset: value.offset,
                        root: false,
                        writer: w,
                        callRefExtractor: extract,
                        printer: args.printer
                    });
                });
            });
            extracted.set(name, {
                ref: false,
                rendered: w.end(),
                src: value.cell,
                srcOffset: value.offset
            });
        }

        // Render methods
        writer.append(printer(`PROGRAM{`, writer.indent));
        writer.inIndent(() => {
            for (let [key] of extracted) {
                writer.append(printer(`DECLPROC ${key};`, writer.indent));
            }
            for (let [key, value] of extracted) {
                let hash = value.src.hash().toString('hex');
                let opstr = `${key} ${value.ref ? 'PROCREF' : 'PROC'}:<{`;
                writer.append(printer({ op: opstr, offset: value.srcOffset, length: 0, hash, cell: value.src }, writer.indent));
                writer.inIndent(() => {
                    value.rendered.split('\n').forEach(line => {
                        writer.append(line); // Already formatted
                    });
                });
                opstr = `}>`;
                writer.append(printer({ op: opstr, offset: value.srcOffset, length: 0, hash, cell: value.src }, writer.indent));
            }
        });
        writer.append(printer(`}END>c`, writer.indent));
        return;
    }

    // Proceed with a regular decompilation
    for (const op of opcodes) {

        // Special cases for call refs
        if (op.op.code === 'CALLREF' && args.callRefExtractor) {
            let id = args.callRefExtractor(op.op.args[0]);
            let opstr = `${id} INLINECALLDICT`;
            writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash, cell: args.src }, writer.indent));
            continue;
        }

        // Special cases for continuations
        if (op.op.code === 'PUSHCONT'
            || op.op.code === 'IFREFELSE'
            || op.op.code === 'CALLREF'
            || op.op.code === 'IFJMPREF'
            || op.op.code === 'IFREF'
            || op.op.code === 'IFREFELSEREF') {
            let c = op.op.args[0];
            let opstr = '<{';
            writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash, cell: args.src }, writer.indent));
            writer.inIndent(() => {
                decompileCell({
                    src: c,
                    srcOffset: 0,
                    root: false,
                    writer: writer,
                    callRefExtractor: args.callRefExtractor,
                    printer: args.printer
                });
            })
            opstr = '}> ' + op.op.code;
            writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash, cell: args.src }, writer.indent));
            continue;
        }

        // Special cases for unknown opcode
        if (op.op.code === 'unknown') {
            writer.append('!' + op.op.data.toString());
            continue;
        }

        // All remaining opcodes
        let opstr = opcodeToString(op.op);
        writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash, cell: args.src }, writer.indent));
    }
}

export function decompileAll(args: { src: Buffer | Cell, printer?: Maybe<Printer> }) {
    let writer = new Writer();
    let src: Cell;
    if (Buffer.isBuffer(args.src)) {
        src = Cell.fromBoc(args.src)[0];
    } else {
        src = args.src;
    }
    let printer = args.printer || createTextPrinter(2);
    decompileCell({
        src,
        srcOffset: 0,
        root: true,
        writer,
        printer
    });
    return writer.end();
}

function createCodeCell(): DictionaryValue<{ offset: number, cell: Cell }> {
    return {
        serialize: (src, builder) => {
            throw Error('Not implemented');
        },
        parse: (src) => {
            let bitsReader = ((src as any)._reader.clone() as BitReader);
            let offset = (bitsReader as any)._offset as number;
            bitsReader.reset();
            let bits = bitsReader.loadBits(bitsReader.remaining);
            let b = beginCell()
                .storeBits(bits);
            while (src.remainingRefs > 0) {
                b.storeRef(src.loadRef());
            }
            return { offset, cell: b.endCell() };
        }
    };
}