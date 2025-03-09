import {Cell} from "@ton/core"
import {DecodedInstruction} from "../decompiler/operand-loader"

export interface ControlRegisterNode {
    readonly type: "control_register"
    readonly value: number
}

export interface StackEntryNode {
    readonly type: "stack_entry"
    readonly value: number
}

export interface GlobalVariableNode {
    readonly type: "global_variable"
    readonly value: number
}

export interface ScalarNode {
    readonly type: "scalar"
    readonly value: number | string | bigint | Cell
}

export interface ReferenceNode {
    readonly type: "reference"
    readonly hash: string
}

export interface MethodReferenceNode {
    readonly type: "method_reference"
    readonly methodId: number
}

export interface DictNode {
    readonly type: "dict"
    readonly keyLen: number
    readonly procedures: ProcedureNode[]
    readonly methods: MethodNode[]
}

export type InstructionArgument =
    | ScalarNode
    | BlockNode
    | ReferenceNode
    | StackEntryNode
    | ControlRegisterNode
    | GlobalVariableNode
    | MethodReferenceNode
    | DictNode

export interface InstructionNode {
    readonly type: "instruction"
    readonly opcode: DecodedInstruction
    readonly arguments: InstructionArgument[]
    readonly offset: number
    readonly length: number
    readonly hash: string
}

export interface BlockNode {
    readonly type: "block"
    readonly instructions: InstructionNode[]
    readonly hash: string
    readonly offset: number
    readonly length: number
    readonly cell: boolean
}

export interface MethodNode {
    readonly type: "method"
    readonly id: number
    readonly body: BlockNode
    readonly hash: string
    readonly offset: number
}

export interface ProcedureNode {
    readonly type: "procedure"
    readonly hash: string
    readonly body: BlockNode
}

export interface ProgramNode {
    readonly type: "program"
    readonly topLevelInstructions: InstructionNode[]
    readonly methods: MethodNode[]
    readonly procedures: ProcedureNode[]
    readonly withRefs: boolean
}
