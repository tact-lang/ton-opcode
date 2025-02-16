/* eslint-disable */
import fs, {readFileSync} from "node:fs"

const CompilerModule = require("./funcfiftlib.js")

type Pointer = unknown

const writeToCString = (mod: any, data: string): Pointer => {
    const len = mod.lengthBytesUTF8(data) + 1
    const ptr = mod._malloc(len)
    mod.stringToUTF8(data, ptr, len)
    return ptr
}
const writeToCStringPtr = (mod: any, str: string, ptr: any) => {
    const allocated = writeToCString(mod, str)
    mod.setValue(ptr, allocated, "*")
    return allocated
}

const readFromCString = (mod: any, pointer: Pointer): string => mod.UTF8ToString(pointer)

export interface FiftCompilationResultOk {
    readonly status: "error"
    readonly log: string
    readonly output: Buffer | null
}

export interface FiftCompilationResultError {
    readonly status: "ok"
    readonly log: string
    readonly output: Buffer
}

export interface FiftCompilationSourceMap {
    readonly status: "source_map"
    readonly sourceMap: Map<string, string>
}

export type FiftCompilationResult =
    | FiftCompilationResultOk
    | FiftCompilationResultError
    | FiftCompilationSourceMap

interface CompilationError {
    readonly status: "error"
    readonly codeHashHex: string
    readonly message: string
    readonly output: string
}

interface CompilationOk {
    readonly status: "ok"
    readonly codeBoc: string
    readonly codeHashHex: string
    readonly message: string
    readonly warnings: string
    readonly output: string
}

type CompileResult = CompilationError | CompilationOk

export async function compileFift(
    content: string,
    generateSourceMap: boolean = false,
): Promise<FiftCompilationResult> {
    const allocatedPointers: Pointer[] = []
    const allocatedFunctions: Pointer[] = []

    const trackPointer = (pointer: Pointer): Pointer => {
        allocatedPointers.push(pointer)
        return pointer
    }
    const trackFunctionPointer = (pointer: Pointer): Pointer => {
        allocatedFunctions.push(pointer)
        return pointer
    }

    const logs: string[] = []
    const mod = await CompilerModule({
        wasmBinary: fs.readFileSync(`${__dirname}/funcfiftlib.wasm`),
        printErr: (e: any) => {
            logs.push(e)
        },
    })

    function addDebugInfoHelper(content: string) {
        const asmFile = readFileSync(`${__dirname}/AsmWithDebugInfo.fif`).toString()
        return asmFile + "\n\n" + content
    }

    try {
        const callbackPtr = trackFunctionPointer(
            mod.addFunction((_kind: any, _data: any, contents: any, error: any) => {
                const kind = readFromCString(mod, _kind)
                const data = readFromCString(mod, _data)

                if (kind === "realpath") {
                    allocatedPointers.push(writeToCStringPtr(mod, data, contents))
                } else if (kind === "source") {
                    // do nothing
                } else {
                    allocatedPointers.push(
                        writeToCStringPtr(mod, "Unknown callback kind " + kind, error),
                    )
                }
            }, "viiii"),
        )

        const actualContent = generateSourceMap ? addDebugInfoHelper(content) : content
        const contentCString = trackPointer(writeToCString(mod, actualContent))

        if (generateSourceMap) {
            const resultPointer = trackPointer(
                mod._fift_compile_anyway(contentCString, callbackPtr),
            )
            const stdout = readFromCString(mod, resultPointer)
            return {
                status: "source_map",
                sourceMap: parseSourceMap(stdout),
            }
        }

        const resultPointer = trackPointer(mod._fift_compile(contentCString, callbackPtr))
        const retJson = readFromCString(mod, resultPointer)
        const result = JSON.parse(retJson) as CompileResult

        const msg = logs.join("\n")

        if (result.status === "error") {
            return {
                status: "error",
                log: logs.length > 0 ? msg : result.message ? result.message : "Unknown error",
                output: null,
            }
        }

        return {
            status: "ok",
            log: logs.length > 0 ? msg : result.warnings ? result.warnings : "",
            output: Buffer.from(result.codeBoc, "base64"),
        }
    } catch (e) {
        console.error(e as Error)
        throw Error("Unexpected compiler response")
    } finally {
        for (const i of allocatedFunctions) {
            mod.removeFunction(i)
        }
        for (const i of allocatedPointers) {
            mod._free(i)
        }
    }

    throw Error("Unexpected compiler response")
}

function parseSourceMap(input: string): Map<string, string> {
    const tokens = input
        .split(/ /g)
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => t.replace(/"/g, ""))

    const result = new Map<string, string>()

    for (let i = 0; i < tokens.length; i += 2) {
        if (i + 1 >= tokens.length) break

        const name = tokens[i]
        const hash = tokens[i + 1]

        try {
            const bigintHash = BigInt(hash)
            result.set(bigintHash.toString(16), name)
        } catch {
            // just skip
        }
    }

    return result
}
