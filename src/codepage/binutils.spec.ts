import { prefixToBin } from "./binutils";

describe('binutils', () => {
    it('should correctly convert from hex to bitstring', async () => {
        expect(prefixToBin('6F').toString()).toBe("6F");
        expect(prefixToBin('6FE_').toString()).toBe("6FE_");
        expect(prefixToBin('CFC0_').toString()).toBe("CFC_");
    });
});