import {describe, it, expect} from "vitest"
import {Cell} from "@ton/core"
import {disassembleRoot} from "../../decompiler/disasm"
import {AssemblyWriter} from "../../printer/assembly-writer"
import {debugSymbols} from "../../utils/known-methods"
import {compileFunc} from "@ton-community/func-js"
import {fail} from "node:assert"
import {compileFiftBackAndCompare} from "./utils"

describe("disassemble", () => {
    it("should decompile and compile back PUSHREF with bytes", async () => {
        const funcRes = await compileFunc({
            sources: [
                {
                    filename: "main.fc",
                    content: `
                    int cell_hash(cell c) asm "HASHCU";

                    cell __gen_cell_cell_37e90db9d1f7725dc0128ee6bad2035fb50479e09a488a29257bed01a23050a0() asm """
                        B{b5ee9c7241010101000d00001600000000537563636573738a3a2a2a} B>boc PUSHREF
                    """;

                    () recv_internal() {
                        cell c = __gen_cell_cell_37e90db9d1f7725dc0128ee6bad2035fb50479e09a488a29257bed01a23050a0();
                        throw(cell_hash(c));
                    }`,
                },
            ],
        })

        if (funcRes.status === "error") {
            fail(`cannot compile FunC: ${funcRes.message}`)
            return
        }

        const buffer = Buffer.from(funcRes.codeBoc, "base64")

        const res = disassembleRoot(Cell.fromBoc(buffer)[0], {
            computeRefs: false,
        })

        const decompiled = AssemblyWriter.write(res, {
            useAliases: true,
            withoutHeader: true,
            debugSymbols: debugSymbols,
        })

        expect(decompiled).toMatchSnapshot()

        await compileFiftBackAndCompare(decompiled, buffer)
    })
})
