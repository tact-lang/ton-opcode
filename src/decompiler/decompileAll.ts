import { Cell, Dictionary, DictionaryValue } from "ton-core";
import { opcodeToString } from "../codepage/opcodeToString";
import { Writer } from "../utils/Writer";
import { decompile } from "./decompiler";
import { knownMethods } from "./knownMethods";

function decompileCell(args: {
    src: Buffer | Cell,
    root: boolean,
    writer: Writer,
    allowUnknown?: boolean,
    callRefExtractor?: (ref: Cell) => string
}) {
    const writer = args.writer;
    const opcodes = decompile({
        src: args.src,
        allowUnknown: args.allowUnknown
    });

    // Check if we have a default opcodes of func output
    if (args.root && opcodes.length === 4 && opcodes[0].op.code === 'SETCP'
        && opcodes[1].op.code === 'DICTPUSHCONST'
        && opcodes[2].op.code === 'DICTIGETJMPZ'
        && opcodes[3].op.code === 'THROWARG') {

        // Load dictionary
        let dictKeyLen = opcodes[1].op.args[0];
        let dictCell = opcodes[1].op.args[1];
        let dict = Dictionary.loadDirect<number, Cell>(Dictionary.Keys.Int(dictKeyLen), createCodeCell(), dictCell);

        // Extract all methods
        let unknownIndex = 0;
        let extracted = new Map<string, { ref: boolean, rendered: string }>();
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
            decompileCell({
                src: cell,
                allowUnknown: args.allowUnknown,
                root: false,
                writer: w,
                callRefExtractor: extract
            });
            extracted.set(name, { ref: true, rendered: w.end() });
            return name;
        }
        for (let [key, value] of dict) {
            let name = knownMethods[key] || '?fun_' + (unknownIndex++);
            let w = new Writer();
            decompileCell({
                src: value,
                allowUnknown: args.allowUnknown,
                root: false,
                writer: w,
                callRefExtractor: extract
            });
            extracted.set(name, { ref: false, rendered: w.end() });
        }

        // Render methods
        writer.append(`PROGRAM{`);
        writer.inIndent(() => {
            for (let [key] of extracted) {
                writer.append(`DECLPROC ${key};`);
            }
            for (let [key, value] of extracted) {
                writer.append(`${key} ${value.ref ? 'PROCREF' : 'PROC'}:<{`);
                writer.inIndent(() => {
                    writer.write(value.rendered);
                });
                writer.append(`}>`);
            }
        });
        writer.append(`}END>c`);
        return;
    }

    // Proceed with a regular decompilation
    for (const op of opcodes) {

        // Special cases for call refs
        if (op.op.code === 'CALLREF' && args.callRefExtractor) {
            let id = args.callRefExtractor(op.op.args[0]);
            writer.append(`${id} INLINECALLDICT`);
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
            writer.append('<{');
            writer.inIndent(() => {
                decompileCell({
                    src: c,
                    allowUnknown: args.allowUnknown,
                    root: false,
                    writer: writer,
                    callRefExtractor: args.callRefExtractor
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
        root: true,
        writer: writer
    });
    return writer.end();
}

function createCodeCell(): DictionaryValue<Cell> {
    return {
        serialize: (src, builder) => {
            return builder.storeSlice(src.beginParse());
        },
        parse: (src) => {
            return src.asCell();
        }
    };
}