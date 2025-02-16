import {BlockNode, InstructionNode} from "./ast"

export function createBlock(
    instructions: InstructionNode[],
    hash: string,
    offset: number,
    length: number,
): BlockNode {
    return {
        type: "block",
        instructions,
        hash,
        offset,
        length,
        cell: false,
    }
}

export function createInstruction(
    opcode: InstructionNode["opcode"],
    args: InstructionNode["arguments"],
    offset: number,
    length: number,
    hash: string,
): InstructionNode {
    return {
        type: "instruction",
        opcode,
        arguments: args,
        offset,
        length,
        hash,
    }
}
