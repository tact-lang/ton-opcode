import {describe, it, expect} from "vitest"
import {debugSymbols} from "../../utils/known-methods"
import fs from "fs"
import {DebugSymbols} from "@scaleton/func-debug-symbols"
import {compileFiftBackAndCompare, decompileAll, decompileRaw} from "./utils"
import {Cell} from "@ton/core"
import {disassembleRoot} from "../../decompiler/disasm"
import {AssemblyWriter} from "../../printer/assembly-writer"

describe("known contracts", () => {
    it("should decompile wallet v1", async () => {
        const wallet = Buffer.from(
            "te6cckEBAQEARAAAhP8AIN2k8mCBAgDXGCDXCx/tRNDTH9P/0VESuvKhIvkBVBBE+RDyovgAAdMfMSDXSpbTB9QC+wDe0aTIyx/L/8ntVEH98Ik=",
            "base64",
        )
        const res = decompileAll(wallet)
        expect(res).toMatchSnapshot()

        // await compileFiftBackAndCompare(res, wallet, true)
    })

    it("should decompile wallet v2", async () => {
        const wallet = Buffer.from(
            "te6cckEBAQEAVwAAqv8AIN0gggFMl7qXMO1E0NcLH+Ck8mCDCNcYINMf0x8B+CO78mPtRNDTH9P/0VExuvKhA/kBVBBC+RDyovgAApMg10qW0wfUAvsA6NGkyMsfy//J7VShNwu2",
            "base64",
        )
        const res = decompileAll(wallet)
        expect(res).toMatchSnapshot()

        // await compileFiftBackAndCompare(res, wallet)
    })

    it("should decompile wallet v3", async () => {
        const wallet = Buffer.from(
            "te6ccgECDAEAARYAART/APSkE/S88sgLAQIBYgIDAgLPBAUCASAICQJdAHQ0wMBcbCjAfpAVGEwExZvBPhhAvhi2zwC2zzy4ILIfwHKAAEBgQEBzwDJ7VSAKBgAlHGVIddKwwCWIdQw0AGk6PkEAIAHWkjB/4HAh10nCH5UwINcLH94gwAAi10nBIbCSW3/gIIIQtueXBrqOFjDTHwGCELbnlwa68uCB1AHQMfABoH/gIIIQJC/MvrqOFjDTHwGCECQvzL668uCB1AHQMfkCoH/gghCqnpf+uuMCMHAHACrTHwGCEKqel/668uCB1AHQMfkCoH8CD7xiHtnm2eGMCgsAEb4V92omhpAADAAi7UTQ0gABl4EBAdcAATHgMHAAAiA=",
            "base64",
        )
        const res = decompileAll(wallet)
        expect(res).toMatchSnapshot()

        const withoutRefs = decompileAll(wallet, debugSymbols, false)
        await compileFiftBackAndCompare(withoutRefs, wallet)
    })

    it("should decompile wallet v4", async () => {
        const wallet = Buffer.from(
            "te6ccgECFAEAAtQAART/APSkE/S88sgLAQIBIAIDAgFIBAUE+PKDCNcYINMf0x/THwL4I7vyZO1E0NMf0x/T//QE0VFDuvKhUVG68qIF+QFUEGT5EPKj+AAkpMjLH1JAyx9SMMv/UhD0AMntVPgPAdMHIcAAn2xRkyDXSpbTB9QC+wDoMOAhwAHjACHAAuMAAcADkTDjDQOkyMsfEssfy/8QERITAubQAdDTAyFxsJJfBOAi10nBIJJfBOAC0x8hghBwbHVnvSKCEGRzdHK9sJJfBeAD+kAwIPpEAcjKB8v/ydDtRNCBAUDXIfQEMFyBAQj0Cm+hMbOSXwfgBdM/yCWCEHBsdWe6kjgw4w0DghBkc3RyupJfBuMNBgcCASAICQB4AfoA9AQw+CdvIjBQCqEhvvLgUIIQcGx1Z4MesXCAGFAEywUmzxZY+gIZ9ADLaRfLH1Jgyz8gyYBA+wAGAIpQBIEBCPRZMO1E0IEBQNcgyAHPFvQAye1UAXKwjiOCEGRzdHKDHrFwgBhQBcsFUAPPFiP6AhPLassfyz/JgED7AJJfA+ICASAKCwBZvSQrb2omhAgKBrkPoCGEcNQICEekk30pkQzmkD6f+YN4EoAbeBAUiYcVnzGEAgFYDA0AEbjJftRNDXCx+AA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA4PABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AAG7SB/oA1NQi+QAFyMoHFcv/ydB3dIAYyMsFywIizxZQBfoCFMtrEszMyXP7AMhAFIEBCPRR8qcCAHCBAQjXGPoA0z/IVCBHgQEI9FHyp4IQbm90ZXB0gBjIywXLAlAGzxZQBPoCFMtqEssfyz/Jc/sAAgBsgQEI1xj6ANM/MFIkgQEI9Fnyp4IQZHN0cnB0gBjIywXLAlAFzxZQA/oCE8tqyx8Syz/Jc/sAAAr0AMntVA==",
            "base64",
        )
        const res = decompileAll(wallet)
        expect(res).toMatchSnapshot()

        const withoutRefs = decompileAll(wallet, debugSymbols, false)
        await compileFiftBackAndCompare(withoutRefs, wallet)
    })

    it("should decompile wallet v5", async () => {
        const wallet = Buffer.from(
            "te6ccgECFAEAAoEAART/APSkE/S88sgLAQIBIAIDAgFIBAUBAvIOAtzQINdJwSCRW49jINcLHyCCEGV4dG69IYIQc2ludL2wkl8D4IIQZXh0brqOtIAg1yEB0HTXIfpAMPpE+Cj6RDBYvZFb4O1E0IEBQdch9AWDB/QOb6ExkTDhgEDXIXB/2zzgMSDXSYECgLmRMOBw4hAPAgEgBgcCASAICQAZvl8PaiaECAoOuQ+gLAIBbgoLAgFIDA0AGa3OdqJoQCDrkOuF/8AAGa8d9qJoQBDrkOuFj8AAF7Ml+1E0HHXIdcLH4AARsmL7UTQ1woAgAR4g1wsfghBzaWduuvLgin8PAeaO8O2i7fshgwjXIgKDCNcjIIAg1yHTH9Mf0x/tRNDSANMfINMf0//XCgAK+QFAzPkQmiiUXwrbMeHywIffArNQB7Dy0IRRJbry4IVQNrry4Ib4I7vy0IgikvgA3gGkf8jKAMsfAc8Wye1UIJL4D95w2zzYEAP27aLt+wL0BCFukmwhjkwCIdc5MHCUIccAs44tAdcoIHYeQ2wg10nACPLgkyDXSsAC8uCTINcdBscSwgBSMLDy0InXTNc5MAGk6GwShAe78uCT10rAAPLgk+1V4tIAAcAAkVvg69csCBQgkXCWAdcsCBwS4lIQseMPINdKERITAJYB+kAB+kT4KPpEMFi68uCR7UTQgQFB1xj0BQSdf8jKAEAEgwf0U/Lgi44UA4MH9Fvy4Iwi1woAIW4Bs7Dy0JDiyFADzxYS9ADJ7VQAcjDXLAgkji0h8uCS0gDtRNDSAFETuvLQj1RQMJExnAGBAUDXIdcKAPLgjuLIygBYzxbJ7VST8sCN4gAQk1vbMeHXTNA=",
            "base64",
        )
        const res = decompileAll(wallet)
        expect(res).toMatchSnapshot()

        // TODO: spot the difference
        // const withoutRefs = decompileAll(wallet, debugSymbols, false)
        // await compileFiftBackAndCompare(withoutRefs, wallet)
    })

    it("should decompile wallet v5 and print Fift with bitcode", async () => {
        const wallet = Buffer.from(
            "te6ccgECFAEAAoEAART/APSkE/S88sgLAQIBIAIDAgFIBAUBAvIOAtzQINdJwSCRW49jINcLHyCCEGV4dG69IYIQc2ludL2wkl8D4IIQZXh0brqOtIAg1yEB0HTXIfpAMPpE+Cj6RDBYvZFb4O1E0IEBQdch9AWDB/QOb6ExkTDhgEDXIXB/2zzgMSDXSYECgLmRMOBw4hAPAgEgBgcCASAICQAZvl8PaiaECAoOuQ+gLAIBbgoLAgFIDA0AGa3OdqJoQCDrkOuF/8AAGa8d9qJoQBDrkOuFj8AAF7Ml+1E0HHXIdcLH4AARsmL7UTQ1woAgAR4g1wsfghBzaWduuvLgin8PAeaO8O2i7fshgwjXIgKDCNcjIIAg1yHTH9Mf0x/tRNDSANMfINMf0//XCgAK+QFAzPkQmiiUXwrbMeHywIffArNQB7Dy0IRRJbry4IVQNrry4Ib4I7vy0IgikvgA3gGkf8jKAMsfAc8Wye1UIJL4D95w2zzYEAP27aLt+wL0BCFukmwhjkwCIdc5MHCUIccAs44tAdcoIHYeQ2wg10nACPLgkyDXSsAC8uCTINcdBscSwgBSMLDy0InXTNc5MAGk6GwShAe78uCT10rAAPLgk+1V4tIAAcAAkVvg69csCBQgkXCWAdcsCBwS4lIQseMPINdKERITAJYB+kAB+kT4KPpEMFi68uCR7UTQgQFB1xj0BQSdf8jKAEAEgwf0U/Lgi44UA4MH9Fvy4Iwi1woAIW4Bs7Dy0JDiyFADzxYS9ADJ7VQAcjDXLAgkji0h8uCS0gDtRNDSAFETuvLQj1RQMJExnAGBAUDXIdcKAPLgjuLIygBYzxbJ7VST8sCN4gAQk1vbMeHXTNA=",
            "base64",
        )
        const cell = Cell.fromBoc(wallet)[0]
        const result = disassembleRoot(cell, {computeRefs: false})

        const res = AssemblyWriter.write(result, {
            useAliases: false,
            withoutHeader: true,
            outputBitcodeAfterInstruction: true,
            debugSymbols: debugSymbols,
        })
        expect(res).toMatchSnapshot()
    })

    it("should decompile wallet v4 speedtest", () => {
        const wallet = Buffer.from(
            "te6ccgECFAEAAtQAART/APSkE/S88sgLAQIBIAIDAgFIBAUE+PKDCNcYINMf0x/THwL4I7vyZO1E0NMf0x/T//QE0VFDuvKhUVG68qIF+QFUEGT5EPKj+AAkpMjLH1JAyx9SMMv/UhD0AMntVPgPAdMHIcAAn2xRkyDXSpbTB9QC+wDoMOAhwAHjACHAAuMAAcADkTDjDQOkyMsfEssfy/8QERITAubQAdDTAyFxsJJfBOAi10nBIJJfBOAC0x8hghBwbHVnvSKCEGRzdHK9sJJfBeAD+kAwIPpEAcjKB8v/ydDtRNCBAUDXIfQEMFyBAQj0Cm+hMbOSXwfgBdM/yCWCEHBsdWe6kjgw4w0DghBkc3RyupJfBuMNBgcCASAICQB4AfoA9AQw+CdvIjBQCqEhvvLgUIIQcGx1Z4MesXCAGFAEywUmzxZY+gIZ9ADLaRfLH1Jgyz8gyYBA+wAGAIpQBIEBCPRZMO1E0IEBQNcgyAHPFvQAye1UAXKwjiOCEGRzdHKDHrFwgBhQBcsFUAPPFiP6AhPLassfyz/JgED7AJJfA+ICASAKCwBZvSQrb2omhAgKBrkPoCGEcNQICEekk30pkQzmkD6f+YN4EoAbeBAUiYcVnzGEAgFYDA0AEbjJftRNDXCx+AA9sp37UTQgQFA1yH0BDACyMoHy//J0AGBAQj0Cm+hMYAIBIA4PABmtznaiaEAga5Drhf/AABmvHfaiaEAQa5DrhY/AAG7SB/oA1NQi+QAFyMoHFcv/ydB3dIAYyMsFywIizxZQBfoCFMtrEszMyXP7AMhAFIEBCPRR8qcCAHCBAQjXGPoA0z/IVCBHgQEI9FHyp4IQbm90ZXB0gBjIywXLAlAGzxZQBPoCFMtqEssfyz/Jc/sAAgBsgQEI1xj6ANM/MFIkgQEI9Fnyp4IQZHN0cnB0gBjIywXLAlAFzxZQA/oCE8tqyx8Syz/Jc/sAAAr0AMntVA==",
            "base64",
        )
        performance.mark("decompileAll")
        for (let i = 0; i < 100; i++) {
            decompileAll(wallet)
        }
        const measurement = performance.measure("decompileAll", "decompileAll")
        console.log("disassembled 100 contracts in", measurement.duration)
    })

    it("should decompile echo", () => {
        const wallet = fs.readFileSync(__dirname + "/__testdata__/echo_Echo.code.boc")
        const res = decompileAll(wallet)
        expect(res).toMatchSnapshot()
    })

    it("should decompile wallet", async () => {
        const wallet = fs.readFileSync(__dirname + "/__testdata__/wallet_Wallet.code.boc")
        const res = decompileAll(wallet)
        expect(res).toMatchSnapshot()

        // TODO: spot the difference
        // const withoutRefs = decompileAll(wallet, debugSymbols, false)
        // await compileFiftBackAndCompare(withoutRefs, wallet)
    })

    it("should decompile mathlib.fc", async () => {
        const debugSymbols2: DebugSymbols = {
            procedures: [...debugSymbols.procedures],
            globals: [...debugSymbols.globals],
            constants: [...debugSymbols.constants],
        }

        debugSymbols2.procedures[0] = {
            methodId: 0,
            name: "main",
            cellHash: "",
        }

        const mathlib = fs.readFileSync(__dirname + "/__testdata__/mathlib.boc")
        const res = decompileAll(mathlib, debugSymbols2)
        expect(res).toMatchSnapshot()

        // TODO: spot the difference
        // const withoutRefs = decompileAll(mathlib, debugSymbols2, false)
        // await compileFiftBackAndCompare(withoutRefs, mathlib)
    })

    it("should decompile Tact 1.6.0 with other layout", async () => {
        const wallet = Buffer.from(
            "te6ccgEBAwEAXQABbP8AII4oMDDQctch0gDSAPpAIRA0UFVvBPhhAfhi7UTQ0gAwkW2RbeIw3PLAguH0pBP0vPLICwEBI6ZMartRNDSADCRbZFt4ts8MYAIAGou2hlbGxvIHdvcmxkg=",
            "base64",
        )
        const res = decompileAll(wallet)
        expect(res).toMatchSnapshot()
    })

    it("should decompile Tact 1.6.0 with other layout and recv_external", async () => {
        const wallet = Buffer.from(
            "te6ccgEBAwEAjAAByv8AII4oMDDQctch0gDSAPpAIRA0UFVvBPhhAfhi7UTQ0gAwkW2RbeIw3PLAguEgwP+OKTAw7UTQ0gAwkW2RbeL4QW8kECNfA4IAoYf4KFjHBfL0MMh/AcoAye1U4PSkE/S88sgLAQEjpkxqu1E0NIAMJFtkW3i2zwxgAgAai7aGVsbG8gd29ybGSA==",
            "base64",
        )
        const res = decompileAll(wallet)
        expect(res).toMatchSnapshot()
    })
})
