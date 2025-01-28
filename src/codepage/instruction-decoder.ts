import { Slice } from "@ton/core";
import { Instruction } from "./tvm-spec";
import { loadOperands, OperandValue } from "./operand-loader";
import { PrefixMatcher } from "./PrefixMatcher";

let prefixMatcher: PrefixMatcher | undefined = undefined;

export interface DecodedInstruction {
    definition: Instruction,
    operands: OperandValue[],
}

export function decodeInstruction(slice: Slice): DecodedInstruction {
    let matcher = prefixMatcher || (prefixMatcher = new PrefixMatcher());
    let definition = matcher.loadPrefix(slice);
    let operands = loadOperands(slice, definition);
    return {
        definition,
        operands,
    }
}