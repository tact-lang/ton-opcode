/* eslint-disable */
import fs from "node:fs"

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
    readonly ok: false
    readonly log: string
    readonly output: Buffer | null
}

export interface FiftCompilationResultError {
    readonly ok: true
    readonly log: string
    readonly output: Buffer
}

export type FiftCompilationResult = FiftCompilationResultOk | FiftCompilationResultError

interface CompilationError {
    readonly status: "error"
    readonly message: string
}

interface CompilationOk {
    readonly status: "ok"
    readonly codeBoc: string
    readonly warnings: string
}

type CompileResult = CompilationError | CompilationOk

export async function compileFift(content: string): Promise<FiftCompilationResult> {
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

        const contentCString = trackPointer(writeToCString(mod, content))
        const resultPointer = trackPointer(mod._func_compile(contentCString, callbackPtr))
        const retJson = readFromCString(mod, resultPointer)
        const result = JSON.parse(retJson) as CompileResult

        const msg = logs.join("\n")

        if (result.status === "error") {
            return {
                ok: false,
                log: logs.length > 0 ? msg : result.message ? result.message : "Unknown error",
                output: null,
            }
        }

        return {
            ok: true,
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
