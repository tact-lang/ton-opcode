import * as fs from "node:fs/promises"
import * as glob from "glob"
import path from "node:path"

const cp = async (fromGlob: string, toPath: string): Promise<void> => {
    const files = glob.sync(fromGlob)
    for (const file of files) {
        await fs.copyFile(file, path.join(toPath, path.basename(file)))
    }
}

const main = async (): Promise<void> => {
    try {
        await cp("./src/fift/funcfiftlib.js", "./dist/fift/")
        await cp("./src/fift/funcfiftlib.wasm", "./dist/fift/")
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

void main()
