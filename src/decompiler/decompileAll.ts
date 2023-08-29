import { Cell, Dictionary, DictionaryValue } from "@ton/core";
import { opcodeToString } from "../codepage/opcodeToString";
import { Maybe } from "../utils/maybe";
import { Writer } from "../utils/Writer";
import { decompile } from "./decompiler";
import { knownMethods } from "./knownMethods";
import { createTextPrinter, Printer } from "./printer";

function decompileCell(args: {
    src: Cell,
    offset: { bits: number, refs: number },
    limit: { bits: number, refs: number } | null,
    root: boolean,
    writer: Writer,
    printer: Printer,
    callRefExtractor?: (ref: Cell) => string
}) {
    const printer = args.printer;
    const writer = args.writer;
    const opcodes = decompile({
        src: args.src,
        offset: args.offset,
        limit: args.limit,
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
        let extracted = new Map<string, { rendered: string, src: Cell, srcOffset: number }>();
        let callRefs = new Map<string, string>();
        function extractCallRef(cell: Cell) {

            // Check if we have a call ref
            let k = cell.hash().toString('hex');
            if (callRefs.has(k)) {
                return callRefs.get(k)!;
            }

            // Add name to a map and assign name
            let name = '?fun_ref_' + cell.hash().toString('hex').substring(0, 16);
            callRefs.set(k, name);

            // Render cell
            let w = new Writer();
            w.inIndent(() => {
                w.inIndent(() => {
                    decompileCell({
                        src: cell,
                        offset: { bits: 0, refs: 0 },
                        limit: null,
                        root: false,
                        writer: w,
                        callRefExtractor: extractCallRef,
                        printer: args.printer
                    });
                });
            });
            extracted.set(name, { rendered: w.end(), src: cell, srcOffset: 0 });
            return name;
        }

        let extractedDict = new Map<number, { name: string, rendered: string, src: Cell, srcOffset: number }>();
        for (let [key, value] of dict) {
            let name = knownMethods[key] || '?fun_' + key;
            let w = new Writer();
            w.inIndent(() => {
                w.inIndent(() => {
                    decompileCell({
                        src: value.cell,
                        offset: { bits: value.offset, refs: 0 },
                        limit: null,
                        root: false,
                        writer: w,
                        callRefExtractor: extractCallRef,
                        printer: args.printer
                    });
                });
            });
            extractedDict.set(key, {
                name,
                rendered: w.end(),
                src: value.cell,
                srcOffset: value.offset
            });
        }

        // Sort and filter
        let dictKeys = Array.from(extractedDict.keys()).sort((a, b) => a - b);
        let refsKeys = Array.from(extracted.keys()).sort();

        // Render methods
        writer.append(printer(`PROGRAM{`, writer.indent));
        writer.inIndent(() => {

            // Declarations
            for (let key of dictKeys) {
                let value = extractedDict.get(key)!;
                writer.append(printer(`DECLPROC ${value.name};`, writer.indent));
            }
            for (let key of refsKeys) {
                writer.append(printer(`DECLPROC ${key};`, writer.indent));
            }

            // Dicts
            for (let key of dictKeys) {
                let value = extractedDict.get(key)!;
                let hash = value.src.hash().toString('hex');
                let opstr = `${value.name} PROC:<{`;
                writer.append(printer({ op: opstr, offset: value.srcOffset, length: 0, hash }, writer.indent));
                writer.inIndent(() => {
                    value.rendered.split('\n').forEach(line => {
                        writer.append(line); // Already formatted
                    });
                });
                opstr = `}>`;
                writer.append(printer({ op: opstr, offset: value.srcOffset, length: 0, hash }, writer.indent));
            }
            // Refs
            for (let key of refsKeys) {
                let value = extracted.get(key)!;
                let hash = value.src.hash().toString('hex');
                let opstr = `${key} PROCREF:<{`;
                writer.append(printer({ op: opstr, offset: value.srcOffset, length: 0, hash }, writer.indent));
                writer.inIndent(() => {
                    value.rendered.split('\n').forEach(line => {
                        writer.append(line); // Already formatted
                    });
                });
                opstr = `}>`;
                writer.append(printer({ op: opstr, offset: value.srcOffset, length: 0, hash }, writer.indent));
            }
        });
        writer.append(printer(`}END>c`, writer.indent));
        return;
    }

    // Proceed with a regular decompilation
    for (const op of opcodes) {
        const opcode = op.op;

        // Special cases for call refs
        if (opcode.code === 'CALLREF' && args.callRefExtractor) {
            let id = args.callRefExtractor(opcode.args[0]);
            let opstr = `${id} INLINECALLDICT`;
            writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash: op.hash }, writer.indent));
            continue;
        }

        // Special case for PUSHCONT
        if (opcode.code === 'PUSHCONT') {
            let opstr = '<{';
            writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash: op.hash }, writer.indent));
            writer.inIndent(() => {
                decompileCell({
                    src: opcode.args[0],
                    offset: { bits: opcode.args[1], refs: opcode.args[2] },
                    limit: { bits: opcode.args[3], refs: opcode.args[4] },
                    root: false,
                    writer: writer,
                    callRefExtractor: args.callRefExtractor,
                    printer: args.printer
                });
            })
            opstr = '}> ' + op.op.code;
            writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash: op.hash }, writer.indent));
            continue;
        }

        // Special cases for continuations
        if (opcode.code === 'IFREFELSE'
            || opcode.code === 'CALLREF'
            || opcode.code === 'IFJMPREF'
            || opcode.code === 'IFREF'
            || opcode.code === 'IFNOTREF'
            || opcode.code === 'IFNOTJMPREF'
            || opcode.code === 'IFREFELSEREF'
            || opcode.code === 'IFELSEREF'
            || opcode.code === 'PUSHREFCONT') {
            let c = opcode.args[0];
            let opstr = '<{';
            writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash: op.hash }, writer.indent));
            writer.inIndent(() => {
                decompileCell({
                    src: c,
                    offset: { bits: 0, refs: 0 },
                    limit: null,
                    root: false,
                    writer: writer,
                    callRefExtractor: args.callRefExtractor,
                    printer: args.printer
                });
            })
            opstr = '}> ' + opcode.code;
            writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash: op.hash }, writer.indent));
            continue;
        }

        // Special cases for unknown opcode
        if (opcode.code === 'unknown') {
            writer.append('!' + opcode.data.toString());
            continue;
        }

        // All remaining opcodes
        let opstr = opcodeToString(opcode);
        writer.append(printer({ op: opstr, offset: op.offset, length: op.length, hash: op.hash }, writer.indent));
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
        offset: { bits: 0, refs: 0 },
        limit: null,
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
            let cloned = src.clone(true);
            let offset = src.offsetBits;
            return { offset, cell: cloned.asCell() };
        }
    };
}