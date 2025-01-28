import { BitString, Slice } from "@ton/core";
import { Instruction } from "./tvm-spec";
import { cp0 } from "./cp0";
import { prefixToBin } from "./binutils";

export class PrefixMatcher {
    instructions: Map<string, Instruction>;
    longestPrefixLength: number;

    constructor() {
        this.instructions = new Map(cp0.instructions.map(insn => [
            prefixToBin(insn.bytecode.prefix).toString(), // normalize prefixes such as CFC0_ to CFC_
            insn
        ]));
        this.longestPrefixLength = Math.max(...cp0.instructions.map(insn => prefixToBin(insn.bytecode.prefix).length));
    }

    public loadPrefix(slice: Slice): Instruction {
        for (let bits = 1; bits <= this.longestPrefixLength; bits++) {
            if (slice.remainingBits < bits) {
                throw new Error(`Prefix not found, slice was: ${slice}`);
            }
            let prefix = slice.preloadBits(bits);
            let instruction = this.instructions.get(prefix.toString());
            if (instruction == undefined) continue;
            let rangeCheck = instruction.bytecode.operands_range_check;
            if (rangeCheck != undefined) {
                if (slice.remainingBits < prefix.length + rangeCheck.length) {
                    continue;
                }
                let operands = slice.clone().skip(prefix.length).loadUint(rangeCheck.length);
                if (operands < rangeCheck.from || operands > rangeCheck.to) {
                    continue;
                }
            }
            slice.skip(bits);
            return instruction
        }
        throw new Error(`Prefix not found, slice was: ${slice}`);
    }
}