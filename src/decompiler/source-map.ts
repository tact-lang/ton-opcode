import {readFileSync} from "node:fs"
import {compileFift} from "../fift/compileFift"

export type ProcedureHash = string

export type SourceMap = Map<ProcedureHash, string>

export async function obtainSourceMap(path: string): Promise<SourceMap> {
    const content = readFileSync(path).toString()
    const result = await compileFift(content, true)
    if (result.status !== "source_map") {
        return new Map()
    }
    return result.sourceMap
}
