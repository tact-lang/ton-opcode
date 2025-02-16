import {BitString} from "@ton/core"
import {Buffer} from "node:buffer"

export const prefixToBin = (prefix: string): BitString => {
    const completionTag = prefix.endsWith("_")
    if (completionTag) {
        prefix = prefix.slice(0, -1)
    }

    const padLength = prefix.length % 2
    const paddedHex = prefix.padEnd(prefix.length + padLength, "0")
    const buffer = Buffer.from(paddedHex, "hex")

    const bits = new BitString(buffer, 0, buffer.byteLength * 8 - padLength * 4)
    if (completionTag) {
        return removeCompletionTag(bits)
    }
    return bits
}

export const removeCompletionTag = (bits: BitString): BitString => {
    const lastSetBitIndex = Array.from({length: bits.length}).findIndex((_, i): boolean =>
        bits.at(bits.length - 1 - i),
    )

    if (lastSetBitIndex === -1) {
        throw new Error("no completion tag")
    }

    return bits.substring(0, bits.length - lastSetBitIndex - 1)
}
