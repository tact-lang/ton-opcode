import {describe, expect, test} from "vitest"
import {Cell} from "@ton/core"
import {AssemblyWriter} from "../../printer/assembly-writer"
import {debugSymbols} from "../../utils/known-methods"
import {obtainSourceMap} from "../../decompiler/source-map"
import {disassembleRoot} from "../../decompiler/disasm"

describe("disassemble", () => {
    test(`should decompile JettonMinter with debug info`, async () => {
        const code =
            "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"
        const source = Cell.fromBase64(code)

        const program = disassembleRoot(source, {
            computeRefs: true,
        })

        const sourceMap = await obtainSourceMap(
            __dirname + "/__testdata__/Jetton_JettonMinter.code.fif",
        )
        const res = AssemblyWriter.write(program, {
            useAliases: false,
            outputBitcodeAfterInstruction: true,
            debugSymbols: debugSymbols,
            sourceMap: sourceMap,
        })
        expect(res).toMatchSnapshot()
    })
})
