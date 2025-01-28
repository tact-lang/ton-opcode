import { beginCell } from "@ton/core";
import { PrefixMatcher } from "./PrefixMatcher";
import { cp0 } from "./cp0";
import { prefixToBin } from "./binutils";

describe('PrefixMatcher', () => {
    it('should correctly decode all instructions', async () => {
        let matcher = new PrefixMatcher();
        for (let instruction of cp0.instructions) {
            try {
                let prefix = prefixToBin(instruction.bytecode.prefix);
                let prefixBuilder = beginCell().storeBits(prefix);
                let range = instruction.bytecode.operands_range_check;
                if (range != undefined) {
                    prefixBuilder.storeUint(range.from, range.length);
                }
                let insnSlice = prefixBuilder.endCell().asSlice();
                let loadedInsn = matcher.loadPrefix(insnSlice);
                expect(insnSlice.remainingBits).toBe(range?.length || 0);
                expect(loadedInsn.mnemonic).toBe(loadedInsn.mnemonic);
            } catch (e) {
                throw new Error(`Error while decoding ${instruction.mnemonic}`, { cause: e });
            }
        }
    });
});