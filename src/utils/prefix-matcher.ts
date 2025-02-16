import {Slice} from "@ton/core"
import {Instruction, Schema} from "../spec/tvm-spec"
import {prefixToBin} from "./binutils"
import cp0Schema from "../spec/cp0.json"

export class PrefixMatcher {
    private readonly instructions: Map<string, Instruction>
    private readonly longestPrefixLength: number

    public constructor() {
        const cp0 = cp0Schema as Schema

        this.instructions = new Map(
            cp0.instructions.map(inst => [
                prefixToBin(inst.bytecode.prefix).toString(), // normalize prefixes such as CFC0_ to CFC_
                inst,
            ]),
        )

        this.longestPrefixLength = Math.max(
            ...cp0.instructions.map(inst => prefixToBin(inst.bytecode.prefix).length),
        )
    }

    public loadPrefix(slice: Slice): Instruction {
        for (let bits = 1; bits <= this.longestPrefixLength; bits++) {
            if (slice.remainingBits < bits) {
                throw new Error(`Prefix not found, slice was: ${slice.toString()}`)
            }

            const prefix = slice.preloadBits(bits)
            const instruction = this.instructions.get(prefix.toString())
            if (instruction === undefined) continue

            const rangeCheck = instruction.bytecode.operands_range_check
            if (rangeCheck !== undefined) {
                if (slice.remainingBits < prefix.length + rangeCheck.length) continue

                const operands = slice.clone().skip(prefix.length).loadUint(rangeCheck.length)
                if (operands < rangeCheck.from || operands > rangeCheck.to) continue
            }

            slice.skip(bits)
            return instruction
        }

        throw new Error(`Prefix not found, slice was: ${slice.toString()}`)
    }
}
