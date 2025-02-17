import {describe, it, expect} from "vitest"
import {Cell} from "@ton/core"
import {disassembleRoot} from "../../decompiler/disasm"
import {AssemblyWriter} from "../../printer/assembly-writer"
import {debugSymbols} from "../../utils/known-methods"
import {compileFunc, ErrorResult, SuccessResult} from "@ton-community/func-js"
import {fail} from "node:assert"
import {compileFiftBackAndCompare} from "./utils"

describe("disassemble", () => {
    it("should decompile and compile back PUSHREF with bytes", async () => {
        await compileAndCheck(`
            int cell_hash(cell c) asm "HASHCU";

            cell __gen_cell_cell_37e90db9d1f7725dc0128ee6bad2035fb50479e09a488a29257bed01a23050a0() asm """
                B{b5ee9c7241010101000d00001600000000537563636573738a3a2a2a} B>boc PUSHREF
            """;

            () recv_internal() {
                cell c = __gen_cell_cell_37e90db9d1f7725dc0128ee6bad2035fb50479e09a488a29257bed01a23050a0();
                throw(cell_hash(c));
            }
        `)
    })

    it("should decompile GETGLOB and GETGLOBVAR correctly", async () => {
        await compileAndCheck(`
            forall X -> (X, ()) ~impure_touch(X x) impure asm "NOP";

            global int first;
            global int second;

            (int) test() impure inline asm "ONE ONE ADD GETGLOBVAR";

            () recv_internal() {
                ~impure_touch(test());
                ~impure_touch(second);
            }
        `)
    })

    it("should decompile SDBEGINSXQ correctly", async () => {
        await compileAndCheck(`
            forall X -> (X, ()) ~impure_touch(X x) impure asm "NOP";

            builder begin_cell() asm "NEWC";
            builder store_slice(builder b, slice s) asm "STSLICER";
            cell end_cell(builder b) asm "ENDC";
            slice begin_parse(cell c) asm "CTOS";

            slice trim_prefix(slice where, slice prefix) asm "SDBEGINSX";
            slice trim_prefix_quiet(slice where, slice prefix) asm "SDBEGINSXQ";

            () recv_internal() {
                slice where = begin_cell().store_slice("hello world").end_cell().begin_parse();
                slice prefix = begin_cell().store_slice("hello").end_cell().begin_parse();
                slice result = trim_prefix(where, prefix);
                slice result2 = trim_prefix_quiet(where, prefix);
                ~impure_touch(result);
                ~impure_touch(result2);
            }
        `)
    })

    async function compileAndCheck(content: string) {
        const funcRes = await compileFunc({
            sources: [
                {
                    filename: "main.fc",
                    content: content,
                },
            ],
        })
        await check(funcRes)
    }

    async function check(funcRes: SuccessResult | ErrorResult) {
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
    }
})
