import {BitString, Builder, Cell, Dictionary, DictionaryValue, Slice} from "@ton/core"
import {subslice} from "../utils/subcell"
import {
    DecodedInstruction,
    decodeInstruction,
    DecompiledInstruction,
    NumericValue,
    OperandValue,
    RefValue,
    SliceValue,
} from "./operand-loader"
import {
    BlockNode,
    InstructionArgument,
    InstructionNode,
    MethodNode,
    ProcedureNode,
    ProgramNode,
} from "../ast/ast"
import {createBlock, createInstruction} from "../ast/helpers"
import {getDisplayNumber, hasHint} from "../spec/helpers"
import {OperandError, UnknownOperandTypeError} from "./errors"

export interface DisassembleParams {
    /**
     * The cell to disassemble.
     */
    readonly source: Cell
    /**
     * The offset in the cell to start disassembling from.
     */
    readonly offset?: {bits: number; refs: number}
    /**
     * The limit in the cell to stop disassembling at.
     */
    readonly limit?: {bits: number; refs: number}
}

export const hex = (value: string): Slice => {
    const b = new Builder()

    let res2 = ""
    for (const ch of value) {
        if (ch === "_") break
        res2 += Number.parseInt(ch, 16).toString(2).padStart(4, "0")
    }

    if (value.endsWith("_")) {
        res2 = res2.replace(/10*$/, "")
    }

    for (const ch of res2) {
        b.storeBit(ch === "1")
    }

    return b.asSlice()
}

/**
 * Disassembles a cell into a list of instructions.
 */
export function disassemble(args: DisassembleParams): DecompiledInstruction[] {
    const bitsOffset = args.offset?.bits ?? 0
    const refsOffset = args.offset?.refs ?? 0

    const bitsLimit = args.limit?.bits ?? args.source.bits.length - bitsOffset
    const refsLimit = args.limit?.refs ?? args.source.refs.length - refsOffset

    // Process only a slice of the source cell to support partial disassembly
    const slice = subslice({
        cell: args.source,
        offsetBits: bitsOffset,
        offsetRefs: refsOffset,
        bits: bitsLimit,
        refs: refsLimit,
    })

    const instructions: DecompiledInstruction[] = []
    const hash = args.source.hash().toString("hex")

    while (slice.remainingBits > 0) {
        const opcodeOffset = slice.offsetBits
        const opcode = decodeInstruction(args.source, slice)
        const opcodeLength = slice.offsetBits - opcodeOffset

        instructions.push({
            op: opcode,
            hash,
            offset: opcodeOffset,
            length: opcodeLength,
        })
    }

    // Since every cell can contain references to other cells, we need to disassemble them recursively.
    while (slice.remainingRefs > 0) {
        const source = slice.loadRef()

        const value: RefValue = {
            type: "ref",
            value: source,
            bitcode: new BitString(Buffer.from([]), 0, 0),
            definition: {
                type: "ref",
                name: "PUSHREF",
                display_hints: [],
            },
        }

        const PSEUDO_PUSHREF: DecompiledInstruction = {
            hash: "",
            length: 0,
            offset: 0,
            op: {
                definition: {
                    mnemonic: "PSEUDO_PUSHREF",
                    doc: {
                        fift: "",
                        opcode: "",
                        gas: "",
                        category: "",
                        stack: "",
                        description: "",
                        fift_examples: [],
                    },
                    bytecode: {
                        operands: [],
                        tlb: "",
                        prefix: "",
                    },
                    control_flow: {
                        branches: [],
                        nobranch: true,
                    },
                    value_flow: {
                        inputs: {
                            stack: [],
                            registers: [],
                        },
                        outputs: {
                            stack: [],
                            registers: [],
                        },
                    },
                    since_version: 0,
                },
                operands: [value],
            },
        }

        instructions.push(PSEUDO_PUSHREF)
    }

    return instructions
}

export interface DisassembleAndProcessParams extends DisassembleParams {
    readonly onCellReference?: (cell: Cell) => void
}

/**
 * Disassembles a cell into a list of instructions with the help of `disassembly` function
 * and processes them to correctly handle references, calls and operands.
 *
 * This function is a core function of the decompiler.
 */
export function disassembleAndProcess(args: DisassembleAndProcessParams): BlockNode {
    const opcodes = disassemble(args)
    const hash = args.source.hash().toString("hex")
    const offset = args.offset?.bits ?? 0

    const instructions = opcodes.map(op => processInstruction(op, args))

    if (instructions.length === 0) {
        return createBlock([], hash, offset, 0)
    }

    const lastInstruction = instructions.at(-1)
    if (lastInstruction === undefined) throw new Error("unreachable")

    return createBlock(instructions, hash, offset, lastInstruction.offset + lastInstruction.length)
}

/**
 * Processes an instruction to correctly handle references, calls and operands.
 */
function processInstruction(
    op: DecompiledInstruction,
    args: DisassembleAndProcessParams,
): InstructionNode {
    const opcode = op.op
    const opcodeName = opcode.definition.mnemonic

    switch (opcodeName) {
        case "CALLREF": {
            return processCallRef(op, args)
        }
        case "CALLDICT":
        case "CALLDICT_LONG":
        case "JMPDICT": {
            return processCallDict(op)
        }
        case "DICTPUSHCONST": {
            const {procedures, methods, keyLen} = deserializeDict(
                op.op.operands,
                args.onCellReference !== undefined,
            )

            return {
                type: "instruction",
                opcode,
                hash: op.hash,
                offset: op.offset,
                length: op.length,
                arguments: [
                    {
                        type: "dict",
                        procedures,
                        methods,
                        keyLen,
                    },
                ],
            }
        }
    }

    return processDefaultInstruction(op, args)
}

/**
 * Processes a `CALLREF` instruction.
 *
 * Decompiler has two modes for decompilation.
 *
 * In bitcode `CALLREF` means that the code of the function
 * placed in the operand of this instruction.
 *
 * In some cases we want to extract the code of the function
 * to another standalone function to make the result more readable.
 */
function processCallRef(
    op: DecompiledInstruction,
    args: DisassembleAndProcessParams,
): InstructionNode {
    const opcode = op.op
    const operand = opcode.operands.find(it => it.definition.name === "c")
    if (!operand || operand.type !== "ref") {
        throw new OperandError(opcode.definition.mnemonic, "c", "Cell", {
            operands: opcode.operands,
        })
    }

    // onCellReference is set when we want to extract the code of the function
    if (args.onCellReference) {
        args.onCellReference(operand.value)
        return createInstruction(
            // actually INLINECALLDICT is Fift opcode, not TVM,
            // but we use it to get same behavior when compiling the resulting
            // Fift asm file back to the TVM code
            PSEUDO_INLINECALLDICT,
            [
                {
                    type: "reference",
                    hash: operand.value.hash().toString("hex"),
                },
            ],
            op.offset,
            op.length,
            op.hash,
        )
    }

    const block = disassembleAndProcess({
        source: operand.value,
        offset: {
            bits: 0,
            refs: 0,
        },
        onCellReference: args.onCellReference,
    })

    return createInstruction(opcode, [{...block, cell: true}], op.offset, op.length, op.hash)
}

/**
 * Processes a `CALLDICT`, `CALLDICT_LONG` or `JMPDICT` instruction.
 */
function processCallDict(op: DecompiledInstruction): InstructionNode {
    const opcode = op.op
    const operand = opcode.operands.find(it => it.definition.name === "n")
    if (!operand || operand.type !== "numeric") {
        throw new OperandError(opcode.definition.mnemonic, "n", "numeric", {
            operands: opcode.operands,
        })
    }

    return createInstruction(
        opcode,
        [
            {
                type: "method_reference",
                methodId: operand.value,
            },
        ],
        op.offset,
        op.length,
        op.hash,
    )
}

/**
 * Processes all other instructions.
 *
 * In other instructions we need to process all its operands if any.
 */
function processDefaultInstruction(
    op: DecompiledInstruction,
    args: DisassembleAndProcessParams,
): InstructionNode {
    const opcode = op.op

    const operands = opcode.operands.map((operand): InstructionArgument => {
        switch (operand.type) {
            case "numeric": {
                return processNumericOperand(operand)
            }
            case "bigint": {
                return {
                    type: "scalar",
                    value: operand.value,
                }
            }
            case "ref":
            case "subslice": {
                return processRefOrSliceOperand(opcode, operand, args)
            }
            default: {
                throw new UnknownOperandTypeError(operand, {
                    instruction: opcode.definition.mnemonic,
                })
            }
        }
    })

    return createInstruction(opcode, operands, op.offset, op.length, op.hash)
}

/**
 * Processes a numeric operand.
 *
 * Numeric operand can be actually be a stack entry, control register or just a scalar.
 */
function processNumericOperand(operand: NumericValue): InstructionArgument {
    const displayHints = operand.definition.display_hints

    // some instructions have hints with value that should be added to the operand
    // for example for `PUSHPOW2` it's 1
    const addHint = displayHints.find(
        (hint): hint is {type: "add"; value: number} => hint.type === "add",
    )
    const add = addHint?.value ?? 0

    const displayNumber = getDisplayNumber(operand, add, displayHints)

    if (hasHint(displayHints, "stack")) {
        return {
            type: "stack_entry",
            value: displayNumber,
        }
    }

    if (hasHint(displayHints, "register")) {
        return {
            type: "control_register",
            value: displayNumber,
        }
    }

    return {
        type: "scalar",
        value: displayNumber,
    }
}

/**
 * Processes a reference or slice operand.
 */
function processRefOrSliceOperand(
    opcode: DecodedInstruction,
    operand: RefValue | SliceValue,
    args: DisassembleAndProcessParams,
): InstructionArgument {
    const displayHints = operand.definition.display_hints
    const opcodeName = opcode.definition.mnemonic

    if (
        hasHint(displayHints, "continuation") ||
        opcodeName === "PUSHCONT" ||
        opcodeName === "PUSHREF" ||
        opcodeName === "PUSHCONT_SHORT" ||
        opcodeName === "PSEUDO_PUSHREF"
    ) {
        if (operand.type === "ref") {
            const block = disassembleAndProcess({
                source: operand.value,
                offset: {
                    bits: 0,
                    refs: 0,
                },
                onCellReference: args.onCellReference,
            })
            return {
                ...block,
                cell: true,
            }
        }

        return disassembleAndProcess({
            source: operand.source,
            offset: {
                bits: operand.offsetBits,
                refs: operand.offsetRefs,
            },
            limit: {
                bits: operand.limitBits,
                refs: operand.limitRefs,
            },
            onCellReference: args.onCellReference,
        })
    }

    return {
        type: "scalar",
        value: operand.value.toString(),
    }
}

function findDictOpcode(opcodes: DecompiledInstruction[]): DecompiledInstruction | undefined {
    const found = opcodes.find(it => it.op.definition.mnemonic === "DICTPUSHCONST")
    if (found) {
        return found
    }

    for (const opcode of opcodes) {
        if (
            opcode.op.definition.mnemonic === "PSEUDO_PUSHREF" ||
            opcode.op.definition.mnemonic === "PUSHREF"
        ) {
            const firstArg = opcode.op.operands[0]
            const nextOpcodes = disassemble({source: firstArg.value as Cell})

            return findDictOpcode(nextOpcodes)
        }
    }

    return found
}

function findRootMethods(opcodes: DecompiledInstruction[]): MethodNode[] {
    const methods: MethodNode[] = []

    if (opcodes[2]?.op.definition.mnemonic === "PUSHCONT") {
        const cont = opcodes[2].op.operands.at(0)
        if (!cont || cont.type !== "subslice") {
            return methods
        }

        const recvInternal = disassembleRawRoot(cont.value)
        methods.push({
            type: "method",
            hash: recvInternal.hash,
            offset: recvInternal.offset,
            body: recvInternal,
            id: 0,
        })
    }

    if (opcodes[6]?.op.definition.mnemonic === "PUSHCONT") {
        const cont = opcodes[6].op.operands.at(0)
        if (!cont || cont.type !== "subslice") {
            return methods
        }

        const recvExternal = disassembleRawRoot(cont.value)
        methods.push({
            type: "method",
            hash: recvExternal.hash,
            offset: recvExternal.offset,
            body: recvExternal,
            id: -1,
        })
    }

    return methods
}

/**
 * Disassembles the root cell into a list of instructions.
 *
 * Use this function if you want to disassemble the whole BoC file with dictionary unpacked.
 */
export function disassembleRoot(
    cell: Cell,
    options: {
        /**
         * Whether to deduplicate refs into separate functions. True, by default.
         */
        computeRefs: boolean
    },
): ProgramNode {
    const opcodes = disassemble({source: cell})

    const args = {
        source: cell,
        offset: {bits: 0, refs: 9},
        onCellReference: undefined,
    }

    const rootMethods = findRootMethods(opcodes)

    const dictOpcode = findDictOpcode(opcodes)
    if (!dictOpcode) {
        // Likely some non-Tact/FunC produced BoC
        return {
            type: "program",
            topLevelInstructions: opcodes.map(op => processInstruction(op, args)),
            procedures: [],
            methods: rootMethods,
            withRefs: options.computeRefs,
        }
    }

    const {procedures, methods} = deserializeDict(dictOpcode.op.operands, options.computeRefs)

    return {
        type: "program",
        topLevelInstructions: opcodes.map(op => processInstruction(op, args)),
        procedures,
        methods: [...rootMethods, ...methods],
        withRefs: options.computeRefs,
    }
}

/**
 * Disassembles a cell without any additional unpacking of the dictionary.
 */
export function disassembleRawRoot(cell: Cell): BlockNode {
    return disassembleAndProcess({
        source: cell,
        onCellReference: undefined,
    })
}

/**
 * Deserializes a dictionary from the dictionary opcode to list
 * of procedures and methods.
 */
function deserializeDict(
    operands: OperandValue[],
    computeRefs: boolean,
): {
    procedures: ProcedureNode[]
    methods: MethodNode[]
    keyLen: number
} {
    const dictKeyLen = operands.find(operand => operand.definition.name === "n")
    const dictCell = operands.find(operand => operand.definition.name === "d")

    if (!dictKeyLen || !dictCell || dictKeyLen.type !== "numeric" || dictCell.type !== "ref") {
        throw new Error("Cannot find valid operands for Cell and length")
    }

    function createCodeCell(): DictionaryValue<{offset: number; cell: Cell}> {
        return {
            serialize: (_src, _builder): never => {
                throw new Error("Not implemented")
            },
            parse: (src): {offset: number; cell: Cell} => {
                const cloned = src.clone(true)
                const offset = src.offsetBits
                return {offset, cell: cloned.asCell()}
            },
        }
    }

    const keyLen = dictKeyLen.value
    const dict = Dictionary.loadDirect<
        number,
        {
            offset: number
            cell: Cell
        }
    >(Dictionary.Keys.Int(keyLen), createCodeCell(), dictCell.value)

    const registeredCells: Map<string, string> = new Map()

    const procedures: ProcedureNode[] = []

    function extractReferencedCell(cell: Cell): string {
        const callHash = cell.hash().toString("hex")
        const prevCell = registeredCells.get(callHash)
        if (prevCell !== undefined) {
            return prevCell
        }

        const name = "?fun_ref_" + callHash.substring(0, 16)
        registeredCells.set(callHash, name)

        const block = disassembleAndProcess({
            source: cell,
            onCellReference: extractReferencedCell,
        })

        procedures.push({
            type: "procedure",
            hash: callHash,
            body: block,
        })

        return name
    }

    const methods = [...dict].map(([key, value]): MethodNode => {
        return {
            type: "method",
            id: key,
            body: disassembleAndProcess({
                source: value.cell,
                offset: {bits: value.offset, refs: 0},
                onCellReference: computeRefs ? extractReferencedCell : undefined,
            }),
            hash: value.cell.hash().toString("hex"),
            offset: value.offset,
        }
    })

    return {
        procedures,
        methods,
        keyLen,
    }
}

const PSEUDO_INLINECALLDICT = {
    definition: {
        mnemonic: "INLINECALLDICT",
        doc: {
            fift: "",
            opcode: "",
            gas: "",
            category: "",
            stack: "",
            description: "",
            fift_examples: [],
        },
        bytecode: {
            operands: [],
            tlb: "",
            prefix: "",
        },
        control_flow: {
            branches: [],
            nobranch: true,
        },
        value_flow: {
            inputs: {
                stack: [],
                registers: [],
            },
            outputs: {
                stack: [],
                registers: [],
            },
        },
        since_version: 0,
    },
    operands: [],
}
