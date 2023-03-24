# TON Opcodes

Evolution of `tvm-disassembler` library that is built to be used also as a library that returns structured code. Has a list of typed opcodes and ability to read individual opcode from a slice.

## Installation

```bash
yarn add @tact-lang/opcode
```

## Usage

```ts
import { decompile } from "@tact-lang/opcode";

// Decompile a single cell sequence into opcode list. Useful for interpretators or for debugging.
const sourceCode = Buffer.from('....', 'base64');
const decompiledOpcodes = decompile({ src: sourceCode });

// Decompile a whole contract. Useful for contract developers and explorers.
const decompiledCode = decompileAll({ src: sourceCode });

```

## License

MIT