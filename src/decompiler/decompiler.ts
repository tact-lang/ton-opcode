import { beginCell, Cell, Slice } from "@ton/core";
import { loadOpcode } from "../codepage/loadOpcode";
import { OpCode } from "../codepage/opcodes.gen";
import { Maybe } from "../utils/maybe";
import { subcell, subslice } from "../utils/subcell";

export type DecompiledOpCode = OpCode | { code: 'unknown', data: Cell };
export type DecompiledInstruction = {
    op: DecompiledOpCode,
    hash: string,
    offset: number,
    length: number
};

export function decompile(args: {
    src: Cell | Buffer,
    offset?: Maybe<{ bits: number, refs: number }>,
    limit?: Maybe<{ bits: number, refs: number }>,
    allowUnknown?: boolean
}): DecompiledInstruction[] {

    // Result collection
    let result: DecompiledInstruction[] = [];

    // Load slice
    let source: Cell;
    if (Buffer.isBuffer(args.src)) {
        source = Cell.fromBoc(args.src)[0];
    } else if (args.src instanceof Cell) {
        source = args.src;
    } else {
        throw new Error('Invalid source');
    }

    // Hash
    let hash = source.hash().toString('hex');

    // Prepare offset
    let bitsDelta = 0;
    let refsDelta = 0;
    if (args.offset) {
        bitsDelta = args.offset.bits;
        refsDelta = args.offset.refs;
    }

    // Prepare offset
    let bitsLimit = args.limit ? (args.limit.bits) : source.bits.length - bitsDelta;
    let refsLimit = args.limit ? (args.limit.refs) : source.refs.length - refsDelta;
    let slice = subslice({
        cell: source,
        offsetBits: bitsDelta,
        offsetRefs: refsDelta,
        bits: bitsLimit,
        refs: refsLimit
    });

    while (slice.remainingBits > 0) {

        // Load opcode
        const opcodeOffset = slice.offsetBits;
        const opcode = loadOpcode(slice, source);
        const opcodeLength = slice.offsetBits - opcodeOffset;

        // Failed case
        if (!opcode.ok) {
            if (args.allowUnknown) {
                let fullCell = beginCell();
                for (let bit of Array.from(opcode.read).map(a => a == '0' ? false : true)) {
                    fullCell.storeBit(bit);
                }
                fullCell.storeSlice(slice);
                result.push({
                    op: {
                        code: 'unknown',
                        data: fullCell.endCell()
                    },
                    hash,
                    offset: opcodeOffset,
                    length: opcodeLength
                });
                break;
            } else {
                throw Error('Unknown opcode: b' + opcode.read);
            }
        }

        // Push opcode to result
        result.push({
            op: opcode.read,
            hash,
            offset: opcodeOffset,
            length: opcodeLength
        });

        // Implicit jump
        if (slice.remainingBits === 0 && slice.remainingRefs > 0) {
            source = slice.loadRef();
            hash = source.hash().toString('hex');
            slice = source.beginParse();
        }
    }

    return result;
}