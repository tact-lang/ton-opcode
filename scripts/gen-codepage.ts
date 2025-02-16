import {compileFromFile} from "json-schema-to-typescript"
import {writeFileSync} from "fs"
import {join} from "path"

async function main() {
    try {
        const specFile = await compileFromFile(join(__dirname, "../src/spec/schema.json"), {
            style: {
                printWidth: 100,
                semi: false,
                singleQuote: false,
                tabWidth: 4,
            },
        })

        writeFileSync(join(__dirname, "../src/spec/tvm-spec.d.ts"), specFile)

        console.log("Successfully generated TVM spec types")
    } catch (error) {
        console.error("Failed to generate TVM spec types:", error)
        process.exit(1)
    }
}

void main()
