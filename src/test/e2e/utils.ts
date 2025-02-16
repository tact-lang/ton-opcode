import {DebugSymbols} from "@scaleton/func-debug-symbols"
import {Cell} from "@ton/core"
import {disassembleRawRoot, disassembleRoot} from "../../index"
import {AssemblyWriter} from "../../printer/assembly-writer"
import {debugSymbols} from "../../utils/known-methods"
import {fail} from "node:assert"
import {compileFift} from "../../fift/compileFift"

export function decompileAll(
    src: Buffer,
    actualDebugSymbols: DebugSymbols = debugSymbols,
    computeRefs?: boolean,
): string {
    const cell = Cell.fromBoc(src)[0]
    const result = disassembleRoot(cell, {computeRefs: computeRefs ?? true})

    return AssemblyWriter.write(result, {
        useAliases: true,
        withoutHeader: true,
        debugSymbols: actualDebugSymbols,
    })
}

export function decompileRaw(src: Buffer, actualDebugSymbols: DebugSymbols = debugSymbols): string {
    const cell = Cell.fromBoc(src)[0]
    const result = disassembleRawRoot(cell)

    return AssemblyWriter.write(result, {
        useAliases: true,
        withoutHeader: true,
        debugSymbols: actualDebugSymbols,
    })
}

export async function compileFiftBackAndCompare(
    content: string,
    before: Buffer,
    raw: boolean = false,
): Promise<void> {
    const result = await compileFift(content)
    if (!result.ok) {
        fail(`cannot compile boc:\n${result.log}`)
    }

    const resultBase64 = result.output.toString("base64")
    const beforeBase64 = before.toString("base64")

    if (resultBase64 !== beforeBase64) {
        const buffer = Buffer.from(resultBase64, "base64")
        const decompileAfterCompilation = raw
            ? decompileRaw(buffer, debugSymbols)
            : decompileAll(buffer, debugSymbols, false)

        expect(decompileAfterCompilation).toBe(content)
    }

    const expected = [...Buffer.from(resultBase64, "base64")].map(it => it.toString(16)).join("\n")
    const actual = [...Buffer.from(beforeBase64, "base64")].map(it => it.toString(16)).join("\n")
    expect(expected).toBe(actual)
}
