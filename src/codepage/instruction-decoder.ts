import { Cell, Slice } from "@ton/core";
import { Instruction } from "./tvm-spec";
import { loadOperands, OperandValue } from "./operand-loader";
import { PrefixMatcher } from "./PrefixMatcher";

let prefixMatcher: PrefixMatcher | undefined = undefined;

export interface DecodedInstruction {
    definition: Instruction,
    operands: OperandValue[],
}

export function decodeInstruction(source: Cell, slice: Slice): DecodedInstruction {
    let matcher = prefixMatcher || (prefixMatcher = new PrefixMatcher());
    let definition = matcher.loadPrefix(slice);
    let operands = loadOperands(source, slice, definition);
    return {
        definition,
        operands,
    }
}