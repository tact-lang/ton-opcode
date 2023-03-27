import * as fs from 'fs';
import { decompileAll } from '../src/decompiler/decompileAll';
const wallet = fs.readFileSync(__dirname + '/../src/decompiler/__testdata__/payouts_Beacon.code.boc');
decompileAll({ src: wallet });