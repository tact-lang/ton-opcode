import {readFileSync} from "node:fs"
import {compileFiftForSourceMap} from "../fift/compileFift"

export type ProcedureHash = string

export type SourceMap = Map<ProcedureHash, string>

export async function obtainSourceMap(path: string): Promise<SourceMap> {
    const content = readFileSync(path).toString()
    const result = await compileFiftForSourceMap(content)
    return result.sourceMap
}
