import fs from 'fs';
import yaml from 'js-yaml';
let defs = yaml.load(fs.readFileSync(__dirname + '/../reference/opcodes.yaml', 'utf-8')) as { opcodes: { [key: string]: ('int' | 'bigint' | 'bool' | 'cell' | 'string')[] | undefined } };

// Generate Defs
let opcodesDefs: string = 'import { Cell } from \'@ton/core\';\n';

function writeOpcode(name: string, args?: ("string" | "bigint" | "int" | "bool" | "cell")[]) {
    if (args && args.length > 0) {
        let mapped = args.map((v) => {
            if (v === 'int') {
                return 'number';
            }
            if (v === 'bigint') {
                return 'bigint';
            }
            if (v === 'bool') {
                return 'boolean';
            }
            if (v === 'cell') {
                return 'Cell';
            }
            if (v === 'string') {
                return 'string';
            }
            throw Error('Unsupported arg: ' + v);
        })
        opcodesDefs += `\n    | { code: '${name}', args: [${mapped.join(', ')}] }`
    } else {
        opcodesDefs += `\n    | { code: '${name}' }`
    }
}

// Export opcodes with arguments
opcodesDefs += '\nexport type OpCodeWithArgs = ';
for (let k of Object.keys(defs.opcodes)) {
    let a = defs.opcodes[k];
    if (a && a.length > 0) {
        writeOpcode(k, defs.opcodes[k]);
    }
}
opcodesDefs += ';\n';
opcodesDefs + '\n';

// Export opcode check function
opcodesDefs += '\nexport function isOpCodeWithArgs(op: OpCode): op is OpCodeWithArgs {\n';
opcodesDefs += '    return Array.isArray((op as any).args) && ((op as any).args.length > 0);\n';
opcodesDefs += '}\n';

// Export opcodes without arguments
opcodesDefs += '\nexport type OpCodeNoArgs = ';
for (let k of Object.keys(defs.opcodes)) {
    let a = defs.opcodes[k];
    if (!a || a.length === 0) {
        writeOpcode(k, defs.opcodes[k]);
    }
}
opcodesDefs += ';\n';
opcodesDefs + '\n';

// Export normal opcodes
opcodesDefs += '\nexport type OpCode = OpCodeWithArgs | OpCodeNoArgs;';

// Write file
fs.writeFileSync(__dirname + '/../src/codepage/opcodes.gen.ts', opcodesDefs);