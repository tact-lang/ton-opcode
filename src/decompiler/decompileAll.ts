// This file is based on code from https://github.com/scaleton-labs/tvm-disassembler

import {Cell, Dictionary, DictionaryValue} from "@ton/core";
import {decompile} from "./decompiler";
import {debugSymbols} from "./knownMethods";
import {AST, BlockNode, InstructionNode, MethodNode, ProcedureNode, ProgramNode, ScalarNode} from "../ast";
import {AssemblerWriter} from "../printer/AssemblerWriter";
import {subcell} from "../utils/subcell";
import { NumericValue, RefValue } from "../codepage/operand-loader";
import { DisplayHint } from "../codepage/tvm-spec";

export function decompileCell(args: {
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
        && opcodes[0].op.definition.mnemonic === 'SETCP'
        && opcodes[1].op.definition.mnemonic === 'DICTPUSHCONST'
        && opcodes[2].op.definition.mnemonic === 'DICTIGETJMPZ'
        && opcodes[3].op.definition.mnemonic === 'THROWARG') {

        // Load dictionary
        let dictKeyLen = opcodes[1].op.operands.find(operand => operand.definition.name == 'n') as NumericValue;
        let dictCell = opcodes[1].op.operands.find(operand => operand.definition.name == 'd') as RefValue;
        let dict = Dictionary.loadDirect<number, {
            offset: number,
            cell: Cell
        }>(Dictionary.Keys.Int(dictKeyLen.value), createCodeCell(), dictCell.value);

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

        // special cases
        if (opcode.definition.mnemonic == 'CALLREF') {
            let operand = opcode.operands.find(op => op.definition.name == 'c')! as RefValue;

            if (args.registerRef) {
                args.registerRef(operand.value);
            }
            return AST.instruction(
                opcode,
                [AST.reference(operand.value.hash().toString('hex'))],
                op.offset,
                op.length,
                op.hash,
            );
        }

        if (opcode.definition.mnemonic == 'CALLDICT' || opcode.definition.mnemonic == 'CALLDICT_LONG' || opcode.definition.mnemonic == 'JMPDICT') {
            let operand = opcode.operands.find(op => op.definition.name == 'n')! as NumericValue;
            return AST.instruction(
                opcode,
                [AST.methodReference(operand.value)],
                op.offset,
                op.length,
                op.hash,
            );
        }

        let operands = [];
        for (let operand of opcode.operands) {
            if (operand.type == 'numeric') {
                let addHint = operand.definition.display_hints.find(hint => hint.type == 'add') as Extract<DisplayHint, {'type': 'add'}>;
                let add = addHint?.value || 0;
                let displayNumber = operand.value + add;
                if (operand.definition.display_hints.some(hint => hint.type == 'pushint4')) {
                    displayNumber = displayNumber > 10 ? displayNumber - 16 : displayNumber;
                } else if (operand.definition.display_hints.some(hint => hint.type == 'optional_nargs')) {
                    displayNumber = displayNumber == 15 ? -1 : displayNumber;
                } else if (operand.definition.display_hints.some(hint => hint.type == 'plduz')) {
                    displayNumber = 32 * (displayNumber + 1);
                }
                if (operand.definition.display_hints.some(hint => hint.type == 'stack')) {
                    operands.push(AST.stackEntry(displayNumber));
                } else if (operand.definition.display_hints.some(hint => hint.type == 'register')) {
                    operands.push(AST.controlRegister(displayNumber));
                } else {
                    operands.push(AST.scalar(displayNumber));
                }
            } else if (operand.type == 'bigint') {
                operands.push(AST.scalar(operand.value));
            } else if (operand.type == 'ref' || operand.type == 'subslice') {
                if (operand.definition.display_hints.some(hint => hint.type == 'continuation')) {
                    if (operand.type == 'ref') {
                        operands.push(decompileCell({
                            root: false,
                            source: operand.value,
                            offset: {
                                bits: 0,
                                refs: 0,
                            },
                            limit: null,
                            registerRef: args.registerRef,
                        }) as BlockNode);
                    } else {
                        operands.push(decompileCell({
                            root: false,
                            source: operand.source,
                            offset: {
                                bits: operand.offsetBits,
                                refs: operand.offsetRefs,
                            },
                            limit: {
                                bits: operand.limitBits,
                                refs: operand.limitRefs,
                            },
                            registerRef: args.registerRef,
                        }) as BlockNode);
                    }
                } else {
                    operands.push(AST.scalar(operand.value.toString()))
                }
            }
        }

        return AST.instruction(
            opcode,
            operands,
            op.offset,
            op.length,
            op.hash,
        );
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
