import { BitString } from "@ton/core";

export let prefixToBin = (prefix: string) => {
    let completionTag = prefix.endsWith('_');
    if (completionTag) {
        prefix = prefix.slice(0, -1);
    }
    let padLen = prefix.length % 2 == 0 ? 0 : 1;
    let paddedHex = prefix.padEnd(prefix.length + padLen, "0");
    let buffer = Buffer.from(paddedHex, "hex");
    let bits = new BitString(buffer, 0, buffer.byteLength * 8 - padLen * 4);
    if (completionTag) {
        bits = removeCompletionTag(bits);
    }
    return bits;
};

export let removeCompletionTag = (bits: BitString) => {
    let newLength = -1;
    for (let i = bits.length; i > 0; i--) {
        if (bits.at(i - 1) == true) {
            newLength = i - 1;
            break
        }
    }
    if (newLength == -1) {
        throw new Error("no completion tag");
    }
    return bits.substring(0, newLength);
};