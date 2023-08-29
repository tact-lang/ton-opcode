import { Cell, Slice } from '@ton/core';
import { OpCode } from './opcodes.gen';
import { Trie } from '../utils/trie';

export type Arg = string | number | boolean | Cell;
export type Op = OpCode;

type OpResolver = ((slice: Slice, cell: Cell) => Op) | Op

export class Codepage {
    private readonly _trie = new Trie<OpResolver>();

    insertHex(hex: string, len: number, op: OpResolver) {
        let prefix = Array.from(parseInt(hex, 16).toString(2)).slice(0, len).join('');
        if (prefix.length < len) {
            prefix = new Array(len - prefix.length).fill('0').join('') + prefix;
        }
        this._trie.insert(prefix, op);
    }

    insertBin(bin: string, op: OpResolver) {
        this._trie.insert(bin, op);
    }

    getOp(bitPrefix: string) {
        return this._trie.getValue(bitPrefix)
    }

    find(prefix: string, maxOccurencies: number = -1) {
        return this._trie.find(prefix, maxOccurencies);
    }
}