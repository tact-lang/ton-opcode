import * as fs from 'fs';
import { decompileAll, decompileCell } from '../src/decompiler/decompileAll';
import { Cell } from '@ton/core';
import { AssemblerWriter } from '../src/printer/AssemblerWriter';
import { debugSymbols } from '../src/decompiler/knownMethods';
const wallet = fs.readFileSync(__dirname + '/../src/decompiler/__testdata__/payouts_Beacon.code.boc');
let source = Cell.fromBoc(wallet)[0];
const ast = decompileCell({
    source,
    offset: {bits: 0, refs: 0},
    limit: null,
    root: true,
});
let text = AssemblerWriter.write(ast, debugSymbols);

console.log(ast);
console.log(text);