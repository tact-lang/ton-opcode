import type {DebugSymbols} from "@scaleton/func-debug-symbols"
import type {
    BlockNode,
    InstructionNode,
    MethodNode,
    ProcedureNode,
    ProgramNode,
    ScalarNode,
} from "../ast/ast"
import {BaseWriter} from "./base-writer"
import type {Schema} from "../spec/tvm-spec"
import cp0Schema from "../spec/cp0.json"
import {debugSymbols} from "../utils/known-methods"

const OPCODE_RENAMES = new Map([
    ["PUSHINT_4", "PUSHINT"],
    ["PUSHINT_8", "PUSHINT"],
    ["PUSHINT_16", "PUSHINT"],
    ["PUSHINT_LONG", "PUSHINT"],
    ["PUSHCONT_SHORT", "PUSHCONT"],
    ["THROW_SHORT", "THROW"],
    ["THROWIFNOT_SHORT", "THROWIFNOT"],
    ["THROWIF_SHORT", "THROWIF"],
    ["CALLDICT_LONG", "CALLDICT"],

    ["LSHIFTDIVMODR_VAR", "LSHIFTDIVMODR"],
    ["LSHIFT_VAR", "LSHIFT"],
    ["RSHIFTR_VAR", "RSHIFTR"],
    ["RSHIFT_VAR", "RSHIFT"],
    ["MULRSHIFTC_VAR", "MULRSHIFTC"],
    ["MULRSHIFTR_VAR", "MULRSHIFTR"],
    ["MULRSHIFT_VAR", "MULRSHIFT"],
    ["QMULRSHIFT_VAR", "QMULRSHIFT"],
    ["PUSHSLICE_LONG", "PUSHSLICE"],

    ["LSHIFTDIVR", "LSHIFT#DIVR"],
    ["LSHIFTDIVMODR", "LSHIFT#DIVMODR"],
    ["RSHIFTRMOD", "RSHIFTR#MOD"],
    ["QLSHIFTDIVMODR", "QLSHIFT#DIVMODR"],
    ["MULRSHIFTRMOD", "MULRSHIFTR#MOD"],

    ["LSHIFT", "LSHIFT#"],
    ["RSHIFT", "RSHIFT#"],
    ["MULRSHIFTR", "MULRSHIFTR#"],
    ["MULRSHIFTC", "MULRSHIFTC#"],
    ["MULMODPOW2", "MULMODPOW2#"],
])

export interface AssemblyWriterOptions {
    /**
     * If true, some instructions will be output as aliases for readability:
     *
     * For example:
     * - `1 PUSHINT` -> `ONE`
     * - `s0 s1 XCHG` -> `SWAP`
     *
     * `true` by default.
     */
    readonly useAliases?: boolean
    /**
     * Don't add any additional header comments in file, by default: false
     */
    readonly withoutHeader?: boolean
    /**
     * If true, shows `//` comment with hex bitcode:
     * ```
     * CTOS                                          // 0xD0
     * 4 LDU                                         // 0xD3 03
     * s0 s1 XCHG                                    // 0x0
     * 1 PUSHINT                                     // 0x7 1
     * AND                                           // 0xB
     * ```
     *
     * `false` by default.
     */
    readonly outputBitcodeAfterInstruction?: boolean
    readonly debugSymbols?: DebugSymbols
}

export class AssemblyWriter {
    private readonly writer: BaseWriter = new BaseWriter()

    private readonly knownGlobals: Map<number, string> = new Map()
    private readonly knownMethods: Map<number, string> = new Map()
    private readonly knownProcedures: Map<string, string> = new Map()

    private readonly cp0: Schema = cp0Schema as Schema
    private readonly options: AssemblyWriterOptions

    public constructor(options: AssemblyWriterOptions) {
        const actualDebugSymbols = options.debugSymbols ?? debugSymbols

        actualDebugSymbols.globals.forEach(glob => {
            this.knownGlobals.set(glob.index, glob.name)
        })

        actualDebugSymbols.procedures.forEach(proc => {
            this.knownMethods.set(proc.methodId, proc.name)
            this.knownProcedures.set(proc.cellHash, proc.name)
        })

        this.options = options
    }

    protected resolveGlobalName(index: number): string {
        return this.knownGlobals.get(index) ?? `${index}`
    }

    protected resolveMethodName(methodId: number): string {
        return this.knownMethods.get(methodId) ?? `?fun_${methodId}`
    }

    protected resolveProcedureName(hash: string): string {
        return this.knownProcedures.get(hash) ?? `?fun_ref_${hash.substring(0, 16)}`
    }

    protected writeProgramNode(node: ProgramNode): void {
        const withoutHeader = this.options.withoutHeader ?? true
        if (!withoutHeader) {
            this.writer.writeLine(`// Decompiled by tvm-dec`)

            if (node.withRefs) {
                this.writer.writeLine(
                    `// NOTE: This TVM assembly code was decompiled with the same code cells`,
                )
                this.writer.writeLine(
                    `// extracted into dictionary procedures for better readability.`,
                )
                this.writer.writeLine(
                    `// If you want to compile this code back, decompile without refs first (computeRefs: false)`,
                )
            }
        }

        this.writer.writeLine(`"Asm.fif" include`)

        if (node.procedures.length === 0 && node.methods.length === 0) {
            this.writer.writeLine("<{")

            this.writer.indent(() => {
                node.topLevelInstructions.forEach(instruction => {
                    this.writeInstructionNode(instruction)
                })
            })

            this.writer.write("}>c")
            return
        }

        this.writer.writeLine("PROGRAM{")
        this.writer.indent(() => {
            const methods = [...node.methods].sort((a, b) => a.id - b.id)
            const procedures = [...node.procedures].sort((a, b) => a.hash.localeCompare(b.hash))

            methods.forEach(method => {
                if (method.id === 0) {
                    this.writer.writeLine(`DECLPROC ${this.resolveMethodName(method.id)}`)
                    return
                }

                this.writer.writeLine(
                    `${method.id} DECLMETHOD ${this.resolveMethodName(method.id)}`,
                )
            })

            procedures.forEach(procedure => {
                this.writer.writeLine(`DECLPROC ${this.resolveProcedureName(procedure.hash)}`)
            })

            methods.forEach(method => {
                this.writeMethodNode(method)
            })
            procedures.forEach(procedure => {
                this.writeNode(procedure)
            })
        })
        this.writer.writeLine("}END>c")
    }

    protected writeMethodNode(node: MethodNode): void {
        const methodName = this.resolveMethodName(node.id)

        this.writer.write(`${methodName} PROC:`)
        this.writeBlockNode(node.body, false)
        this.writer.newLine()
    }

    protected writeProcedureNode(node: ProcedureNode): void {
        const procedureName = this.resolveProcedureName(node.hash)

        this.writer.write(`${procedureName} PROCREF:`)
        this.writeBlockNode(node.body, false)
        this.writer.newLine()
    }

    protected writeBlockNode(node: BlockNode, top: boolean): void {
        if (top) {
            this.writer.writeLine(`"Asm.fif" include`)
        }

        this.writer.writeLine("<{")
        this.writer.indent(() => {
            for (const instruction of node.instructions) {
                this.writeInstructionNode(instruction)
            }
        })
        if (node.cell || top) {
            this.writer.write("}>c")
        } else {
            this.writer.write("}>")
        }
    }

    protected maybeSpecificWrite(node: InstructionNode): string | null {
        const opcode = node.opcode.definition.mnemonic

        const firstArg = (node.arguments[0] as ScalarNode | undefined)?.value
        const secondArg = (node.arguments[1] as ScalarNode | undefined)?.value
        if (firstArg === undefined) return null

        const originalInstruction = this.cp0.instructions.find(i => i.mnemonic === opcode)
        if (!originalInstruction) return null

        const matchingAlias = this.cp0.aliases.find(alias => {
            if (alias.alias_of !== opcode) {
                return false
            }

            if (alias.mnemonic === "DUMP") {
                // skip DUMP here for now, we cannot compile back with it
                return false
            }

            const operands = alias.operands
            for (const [key, value] of Object.entries(operands)) {
                const argIndex = originalInstruction.bytecode.operands.findIndex(
                    op => op.name === key,
                )
                if (argIndex === -1) return false

                const actualArgument = node.arguments[argIndex]
                if (
                    actualArgument.type !== "scalar" &&
                    actualArgument.type !== "stack_entry" &&
                    actualArgument.type !== "control_register"
                ) {
                    return false
                }

                const actualValue = actualArgument.value
                if (actualValue !== value) {
                    return false
                }
            }

            return true
        })

        const useAliases = this.options.useAliases ?? true
        if (matchingAlias && useAliases) {
            return matchingAlias.mnemonic
        }

        if (opcode === "SETCP") {
            return `SETCP${firstArg.toString()}`
        }

        if (opcode === "XCHG_0I") {
            return `s0 s${firstArg.toString()} XCHG`
        }

        if (opcode === "XCHG_1I") {
            return `s1 s${firstArg.toString()} XCHG`
        }

        if (opcode === "XCHG_0I_LONG") {
            return `s0 ${firstArg.toString()} s() XCHG`
        }

        if (opcode === "POP_LONG") {
            return `${firstArg.toString()} s() POP`
        }

        if (opcode === "XCHG_IJ" && secondArg !== undefined) {
            return `s${firstArg.toString()} s${secondArg.toString()} XCHG`
        }

        if (opcode === "ADDCONST") {
            if (firstArg === 1) {
                return "INC"
            }
            if (firstArg === -1) {
                return "DEC"
            }
        }

        if (opcode === "MULCONST") {
            if (firstArg === -1) {
                return "NEGATE"
            }
        }

        if (
            originalInstruction.bytecode.operands.length === 1 &&
            originalInstruction.doc.fift.endsWith("#")
        ) {
            return `${firstArg.toString()} ${opcode}#`
        }

        if (opcode === "CALLXARGS_VAR") {
            return `${firstArg.toString()} -1 CALLXARGS`
        }

        if (opcode === "PUSH_LONG") {
            return `${firstArg.toString()} s() PUSH`
        }

        if (opcode === "PUSHREF" && firstArg.toString().startsWith("x")) {
            return `<b x${firstArg.toString().slice(1)} s, b> PUSHREF`
        }

        if (opcode === "PUSHREFSLICE" && firstArg.toString().startsWith("x")) {
            return `<b x${firstArg.toString().slice(1)} s, b> PUSHREFSLICE`
        }

        if (
            originalInstruction.bytecode.operands.length === 1 &&
            originalInstruction.doc.fift.includes("#") &&
            !originalInstruction.doc.fift.includes(" ")
        ) {
            return `${firstArg.toString()} ${originalInstruction.doc.fift}`
        }

        // Debug
        if (opcode === "DEBUG") {
            if (firstArg === 0x00) {
                return "DUMPSTK"
            }
            if (firstArg === 0x14) {
                return "STRDUMP"
            }

            if (
                secondArg !== undefined &&
                typeof firstArg === "number" &&
                typeof secondArg === "number"
            ) {
                // "fift": "{i*16+j} DEBUG",
                return `${firstArg * 16 + secondArg} DEBUG`
            }
        }

        if (opcode === "DEBUGSTR") {
            const cell = firstArg as string
            const buffer = Buffer.from(cell.slice(2, -1), "hex")
            return `"${buffer.toString()}" DEBUGSTR`
        }

        return null
    }

    protected writeInstructionNode(node: InstructionNode): void {
        const specific = this.maybeSpecificWrite(node)
        if (specific !== null) {
            this.writer.write(specific)
            this.writeBinaryRepresentationIfNeeded(node)
            this.writer.writeLine("")
            return
        }

        node.arguments.forEach(arg => {
            switch (arg.type) {
                case "stack_entry": {
                    if (arg.value < 0) {
                        this.writer.write(`s(${arg.value}) `)
                        break
                    }
                    this.writer.write(`s${arg.value} `)
                    break
                }
                case "control_register": {
                    if (arg.value < 0) {
                        this.writer.write(`c(${arg.value}) `)
                        break
                    }
                    this.writer.write(`c${arg.value} `)
                    break
                }
                case "scalar": {
                    this.writer.write(`${arg.value.toString()} `)
                    break
                }
                case "reference": {
                    this.writer.write(`${this.resolveProcedureName(arg.hash)} `)
                    break
                }
                case "global_variable": {
                    this.writer.write(`${this.resolveGlobalName(arg.value)} `)
                    break
                }
                case "method_reference": {
                    this.writer.write(`${this.resolveMethodName(arg.methodId)} `)
                    break
                }
                case "block": {
                    this.writeBlockNode(arg, false)
                    this.writer.write(" ")
                    break
                }
                case "dict": {
                    // TODO
                    break
                }
            }
        })

        this.writer.write(
            OPCODE_RENAMES.get(node.opcode.definition.mnemonic) ?? node.opcode.definition.mnemonic,
        )

        this.writeBinaryRepresentationIfNeeded(node)

        this.writer.writeLine("")
    }

    private writeBinaryRepresentationIfNeeded(node: InstructionNode): void {
        if (!this.options.outputBitcodeAfterInstruction) return

        // Example output
        // CTOS                                          // 0xD0
        // 4 LDU                                         // 0xD3 03
        // s0 s1 XCHG                                    // 0x0 1
        // 1 PUSHINT                                     // 0x7 1
        // AND                                           // 0xB0
        // NEGATE                                        // 0xA3

        const space = " ".repeat(Math.max(1, 50 - this.writer.lineLength()))
        this.writer.write(`${space}// 0x` + node.opcode.definition.bytecode.prefix)

        node.opcode.operands.forEach(arg => {
            this.writer.write(" ")
            switch (arg.type) {
                case "numeric":
                case "ref":
                case "bigint": {
                    this.writer.write(arg.bitcode.toString())
                    break
                }
                case "subslice": {
                    this.writer.write(arg.value.bits.toString())
                    break
                }
            }
        })
    }

    protected writeNode(
        node: ProgramNode | MethodNode | ProcedureNode | BlockNode | InstructionNode,
        top: boolean = false,
    ): void {
        switch (node.type) {
            case "program": {
                this.writeProgramNode(node)
                break
            }
            case "method": {
                this.writeMethodNode(node)
                break
            }
            case "procedure": {
                this.writeProcedureNode(node)
                break
            }
            case "block": {
                this.writeBlockNode(node, top)
                break
            }
            case "instruction": {
                this.writeInstructionNode(node)
                break
            }
        }
    }

    protected output(): string {
        return this.writer.end()
    }

    public static write(
        node: ProgramNode | MethodNode | ProcedureNode | BlockNode,
        options: AssemblyWriterOptions,
    ): string {
        const writer = new AssemblyWriter(options)
        writer.writeNode(node, true)
        return writer.output()
    }
}
