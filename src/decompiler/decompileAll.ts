// This file is based on code from https://github.com/scaleton-labs/tvm-disassembler

import {Cell, Dictionary, DictionaryValue} from "@ton/core";
import {decompile} from "./decompiler";
import {debugSymbols} from "./knownMethods";
import {AST, BlockNode, InstructionNode, MethodNode, ProcedureNode, ProgramNode, ScalarNode} from "../ast";
import {AssemblerWriter} from "../printer/AssemblerWriter";
import {subcell} from "../utils/subcell";

function decompileCell(args: {
    root: boolean;
    source: Cell;
    offset: { bits: number; refs: number };
    limit: { bits: number; refs: number } | null;
    registerRef?: (ref: Cell) => void;
}): ProgramNode | BlockNode {
    const opcodes = decompile({
        src: args.source,
        offset: args.offset,
        limit: args.limit,
        allowUnknown: false
    });

    // Check if we have a default opcodes of func output
    if (args.root && opcodes.length === 4
        && opcodes[0].op.code === 'SETCP'
        && opcodes[1].op.code === 'DICTPUSHCONST'
        && opcodes[2].op.code === 'DICTIGETJMPZ'
        && opcodes[3].op.code === 'THROWARG') {

        // Load dictionary
        let dictKeyLen = opcodes[1].op.args[0];
        let dictCell = opcodes[1].op.args[1];
        let dict = Dictionary.loadDirect<number, {
            offset: number,
            cell: Cell
        }>(Dictionary.Keys.Int(dictKeyLen), createCodeCell(), dictCell);

        // Extract all methods
        let registeredCells = new Map<string, string>();

        const procedures: ProcedureNode[] = [];

        function extractCallRef(cell: Cell) {
            // Check if we have a call ref
            let callHash = cell.hash().toString('hex');
            if (registeredCells.has(callHash)) {
                return registeredCells.get(callHash)!;
            }

            // Add name to a map and assign name
            let name = '?fun_ref_' + cell.hash().toString('hex').substring(0, 16);
            registeredCells.set(callHash, name);

            const node = decompileCell({
                source: cell,
                offset: {bits: 0, refs: 0},
                limit: null,
                root: false,
                registerRef: extractCallRef,
            });

            procedures.push(
                AST.procedure(
                    callHash,
                    node as BlockNode,
                ),
            );

            return name;
        }

        const methods = [...dict].map(([key, value]): MethodNode => {
            return AST.method(
                key,
                decompileCell({
                    source: value.cell,
                    offset: {bits: value.offset, refs: 0},
                    limit: null,
                    root: false,
                    registerRef: extractCallRef,
                }) as BlockNode,
                value.cell.hash().toString('hex'),
                value.offset,
            )
        });

        return AST.program(methods, procedures);
    }

    // Proceed with a regular decompilation
    const instructions: InstructionNode[] = opcodes.map(op => {
        const opcode = op.op;

        switch (opcode.code) {
            case 'CALLREF':
                if (args.registerRef) {
                    args.registerRef(opcode.args[0]);
                }

                return AST.instruction(
                    'INLINECALLDICT',
                    [AST.reference(opcode.args[0].hash().toString('hex'))],
                    op.offset,
                    op.length,
                    op.hash,
                );

            case 'CALLDICT':
                return AST.instruction(
                    opcode.code,
                    [AST.methodReference(opcode.args[0])],
                    op.offset,
                    op.length,
                    op.hash,
                );

            case 'PUSHCONT':
                return AST.instruction(
                    opcode.code,
                    [
                        decompileCell({
                            source: opcode.args[0],
                            offset: {
                                bits: opcode.args[1],
                                refs: opcode.args[2],
                            },
                            limit: {
                                bits: opcode.args[3],
                                refs: opcode.args[4],
                            },
                            root: false,
                            registerRef: args.registerRef,
                        }) as BlockNode,
                    ],
                    op.offset,
                    op.length,
                    op.hash,
                );

            // Slices
            case 'PUSHSLICE':
            case 'STSLICECONST':
                const slice = subcell({
                    cell: opcode.args[0],
                    offsetBits: opcode.args[1],
                    offsetRefs: opcode.args[2],
                    bits: opcode.args[3],
                    refs: opcode.args[4],
                });

                return AST.instruction(
                    opcode.code,
                    [AST.scalar(slice.toString())],
                    op.offset,
                    op.length,
                    op.hash,
                );

            // Special cases for continuations
            case 'IFREFELSE':
            case 'IFJMPREF':
            case 'IFREF':
            case 'IFNOTREF':
            case 'IFNOTJMPREF':
            case 'IFREFELSEREF':
            case 'IFELSEREF':
            case 'PUSHREFCONT':
                return AST.instruction(
                    opcode.code,
                    [
                        decompileCell({
                            root: false,
                            source: opcode.args[0],
                            offset: {
                                bits: 0,
                                refs: 0,
                            },
                            limit: null,
                            registerRef: args.registerRef,
                        }) as BlockNode,
                    ],
                    op.offset,
                    op.length,
                    op.hash,
                );

            // Globals
            case 'SETGLOB':
            case 'GETGLOB':
                return AST.instruction(
                    opcode.code,
                    [AST.globalVariable(opcode.args[0])],
                    op.offset,
                    op.length,
                    op.hash,
                );

            // Control Registers
            case 'POPCTR':
            case 'PUSHCTR':
                return AST.instruction(
                    opcode.code === 'POPCTR' ? 'POP' : 'PUSH',
                    [AST.controlRegister(opcode.args[0])],
                    op.offset,
                    op.length,
                    op.hash,
                );

            // Stack Primitives
            case 'POP':
            case 'PUSH':
                return AST.instruction(
                    opcode.code,
                    [AST.stackEntry(opcode.args[0])],
                    op.offset,
                    op.length,
                    op.hash,
                );

            // OPCODE s(i) s(j)
            case 'XCHG':
            case 'XCHG2':
            case 'XCPU':
            case 'PUXC':
            case 'PUSH2':
                return AST.instruction(
                    opcode.code,
                    [AST.stackEntry(opcode.args[0]), AST.stackEntry(opcode.args[1])],
                    op.offset,
                    op.length,
                    op.hash,
                );

            // OPCODE s(i) s(j) s(k)
            case 'XCHG3':
            case 'PUSH3':
            case 'XC2PU':
            case 'XCPUXC':
            case 'XCPU2':
            case 'PUXC2':
            case 'PUXCPU':
            case 'PU2XC':
                return AST.instruction(
                    opcode.code,
                    [
                        AST.stackEntry(opcode.args[0]),
                        AST.stackEntry(opcode.args[1]),
                        AST.stackEntry(opcode.args[2]),
                    ],
                    op.offset,
                    op.length,
                    op.hash,
                );

            // All remaining opcodes
            default:
                return AST.instruction(
                    opcode.code as InstructionNode['opcode'],
                    'args' in opcode
                        ? opcode.args.map((arg): ScalarNode => AST.scalar(arg as any))
                        : [],
                    op.offset,
                    op.length,
                    op.hash,
                );
        }
    })

    if (instructions.length === 0) {
        return AST.block(
            [],
            args.source.hash().toString('hex'),
            args.offset.bits,
            0,
        );
    }

    const lastInstruction = instructions[instructions.length - 1];

    return AST.block(
        instructions,
        args.source.hash().toString('hex'),
        args.offset.bits,
        lastInstruction.offset + lastInstruction.length,
    );
}

export function decompileAll(args: { src: Buffer | Cell }) {
    let source: Cell;
    if (Buffer.isBuffer(args.src)) {
        source = Cell.fromBoc(args.src)[0];
    } else {
        source = args.src;
    }

    const ast = decompileCell({
        source,
        offset: {bits: 0, refs: 0},
        limit: null,
        root: true,
    });

    return AssemblerWriter.write(ast, debugSymbols);
}

function createCodeCell(): DictionaryValue<{ offset: number, cell: Cell }> {
    return {
        serialize: (src, builder) => {
            throw Error('Not implemented');
        },
        parse: (src) => {
            let cloned = src.clone(true);
            let offset = src.offsetBits;
            return {offset, cell: cloned.asCell()};
        }
    };
}
