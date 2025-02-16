import {describe, it, expect} from "vitest"
import {debugSymbols} from "../../utils/known-methods"
import {decompileAll} from "./utils"
import * as fs from "fs"
import {compileFift} from "../../fift/compileFift"
import {fail} from "node:assert"
import {hash} from "crypto"

describe("tact contracts", () => {
    const contractsData = JSON.parse(
        fs.readFileSync(__dirname + "/__testdata__/contracts.json", "utf8"),
    )

    const EXOTIC_CELL_LIBRARIES_SKIP = [
        "EQCIwN4FhUsdeEjjYTHeRetrXS_9K3bvteAg9Ksp4PUtBaMD",
        "EQCXqSzQRg6Pc_GSP2XuJUl-ASbf1NL9eBO5IqJESUcphuAe",
        "EQDVMTMBlsgP_34zAqdcXO7MPsIq2EaxnJmEoLsfgLMnfUhS",
        "EQCGXrvOsqTAcfk2Ug3VTJ_5QEDIa4FAnurTmj3nPW_4-0il",
        "EQD9NKce9Tl5tIuL5cmUu5zbEWM4TnW_gXZi7ieGOYGmBcC7",
    ]

    const MULTI_CELLS_SKIP = [
        "EQDZ81ZvxRfutjkALcUK0q3Cuusm1XtmhEwUiGSeviLpPARH",
        "EQDCVDaWefyhmFg1MUD1EQCSJl9pmH_GMuPgHJ3FnE0JHWK0",
        "EQAZ7PZZMGHD6nKDAFTJBXqxpeFy7ZOWQ6v5aNE0fbTSb4iz",
        "EQDZnlOtLWBt4djZufCJlUd1j6xxohCbfkmOzSSv4Xz9lnvU",
        "EQA99L2ID3cssTgJDoXHmZ_lEw8ADGOz-nrUXT0xah7cVlf6",
    ]

    for (const contract of contractsData.contracts) {
        if (
            EXOTIC_CELL_LIBRARIES_SKIP.includes(contract.address) ||
            MULTI_CELLS_SKIP.includes(contract.address)
        ) {
            continue
        }

        it(`should decompile ${contract.mainFile}-${contract.address}`, async () => {
            const source = Buffer.from(contract.code, "base64")

            const res = decompileAll(source)
            expect(hash("md5", res)).toMatchSnapshot(
                `${contract.mainFile ?? contract.address}-with-refs`,
            )

            const withoutRefs = decompileAll(source, debugSymbols, false)

            const result = await compileFift(withoutRefs)
            if (!result.ok) {
                fail(`cannot compile boc:\n${result.log}`)
            }
        })
    }
})
