// This file is based on code from https://github.com/scaleton-labs/tvm-disassembler

import {
    BlockNode,
    InstructionNode,
    MethodNode,
    ProcedureNode,
    ProgramNode,
    ReferenceNode,
    ScalarNode,
    NodeType,
    ControlRegisterNode,
    StackEntryNode,
    GlobalVariableNode,
    MethodReferenceNode,
} from './nodes';

export class AST {
    static program(
        methods: MethodNode[],
        procedures: ProcedureNode[],
    ): ProgramNode {
        return {
            type: NodeType.PROGRAM,
            methods,
            procedures,
        };
    }

    static method(
        id: number,
        body: BlockNode,
        sourceHash: string,
        sourceOffset: number,
    ): MethodNode {
        return {
            type: NodeType.METHOD,
            id,
            body,
            hash: sourceHash,
            offset: sourceOffset,
        };
    }

    static procedure(hash: string, body: BlockNode): ProcedureNode {
        return {
            type: NodeType.PROCEDURE,
            hash,
            body,
        };
    }

    static block(
        instructions: InstructionNode[],
        hash: string,
        offset: number,
        length: number,
    ): BlockNode {
        return {
            type: NodeType.BLOCK,
            instructions,
            hash,
            offset,
            length,
        };
    }

    static instruction(
        opcode: InstructionNode['opcode'],
        args: InstructionNode['arguments'],
        offset: number,
        length: number,
        hash: string,
    ): InstructionNode {
        return {
            type: NodeType.INSTRUCTION,
            opcode,
            arguments: args,
            offset,
            length,
            hash,
        };
    }

    static scalar(value: string | number | bigint): ScalarNode {
        return {
            type: NodeType.SCALAR,
            value,
        };
    }

    static reference(hash: string): ReferenceNode {
        return {
            type: NodeType.REFERENCE,
            hash,
        };
    }

    static controlRegister(index: number): ControlRegisterNode {
        return {
            type: NodeType.CONTROL_REGISTER,
            value: index,
        };
    }

    static stackEntry(index: number): StackEntryNode {
        return {
            type: NodeType.STACK_ENTRY,
            value: index,
        };
    }

    static globalVariable(index: number): GlobalVariableNode {
        return {
            type: NodeType.GLOBAL_VARIABLE,
            value: index,
        };
    }

    static methodReference(method: number): MethodReferenceNode {
        return {
            type: NodeType.METHOD_REFERENCE,
            methodId: method,
        };
    }
}
