// This file is based on code from https://github.com/scaleton-labs/tvm-disassembler

import {Cell} from '@ton/core';
import {OpCode} from '../codepage/opcodes.gen';

export enum NodeType {
    PROGRAM,
    METHOD,
    BLOCK,
    INSTRUCTION,
    SCALAR,
    REFERENCE,
    PROCEDURE,
    CONTROL_REGISTER,
    STACK_ENTRY,
    GLOBAL_VARIABLE,
    METHOD_REFERENCE,
}

export type ControlRegisterNode = {
    type: NodeType.CONTROL_REGISTER;
    value: number;
};

export type StackEntryNode = {
    type: NodeType.STACK_ENTRY;
    value: number;
};

export type GlobalVariableNode = {
    type: NodeType.GLOBAL_VARIABLE;
    value: number;
};

export type ScalarNode = {
    type: NodeType.SCALAR;
    value: number | string | bigint | Cell;
};

export type ReferenceNode = {
    type: NodeType.REFERENCE;
    hash: string;
};

export type MethodReferenceNode = {
    type: NodeType.METHOD_REFERENCE;
    methodId: number;
};

export type InstructionNode = {
    type: NodeType.INSTRUCTION;
    opcode: OpCode['code'];
    arguments: (
        | ScalarNode
        | BlockNode
        | ReferenceNode
        | StackEntryNode
        | ControlRegisterNode
        | GlobalVariableNode
        | MethodReferenceNode
        )[];
    offset: number;
    length: number;
    hash: string;
};

export type BlockNode = {
    type: NodeType.BLOCK;
    instructions: InstructionNode[];
    hash: string;
    offset: number;
    length: number;
};

export type MethodNode = {
    type: NodeType.METHOD;
    id: number;
    body: BlockNode;
    hash: string;
    offset: number;
};

export type ProcedureNode = {
    type: NodeType.PROCEDURE;
    hash: string;
    body: BlockNode;
};

export type ProgramNode = {
    type: NodeType.PROGRAM;
    methods: MethodNode[];
    procedures: ProcedureNode[];
};
