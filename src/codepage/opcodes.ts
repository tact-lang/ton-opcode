import { beginCell, Cell, Slice } from '@ton/core';
import { Codepage } from './Codepage';

const CP0Auto = new Codepage();

CP0Auto.insertHex('0', 4, (slice) => {
    let n = slice.loadUint(4);
    return { code: 'XCHG', args: [0, n] };
});
CP0Auto.insertHex('1', 4, (slice) => {
    let n = slice.loadUint(4);
    if (n === 0) {
        let i = slice.loadUint(4);
        let j = slice.loadUint(4);
        return { code: `XCHG`, args: [i, j] };
    }
    if (n === 1) {
        let i = slice.loadUint(8);
        return { code: 'XCHG', args: [0, i] };
    }
    return { code: 'XCHG', args: [1, n] };
})
CP0Auto.insertHex('2', 4, (slice) => {
    let n = slice.loadUint(4);
    return { code: 'PUSH', args: [n] };
})
CP0Auto.insertHex('3', 4, (slice) => {
    let n = slice.loadUint(4);
    return { code: 'POP', args: [n] };
})
CP0Auto.insertHex('4', 4, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    let k = slice.loadUint(4);
    return { code: 'XCHG3', args: [i, j, k] };
})
CP0Auto.insertHex('50', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    return { code: 'XCHG2', args: [i, j] };
})
CP0Auto.insertHex('51', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    return { code: 'XCPU', args: [i, j] };
})
CP0Auto.insertHex('52', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    return { code: 'PUXC', args: [i, j + 1] };
})
CP0Auto.insertHex('53', 8, (slice) => {
    let args = slice.loadUint(8);
    let first = args >> 4 & 0xf;
    let second = args & 0xf;
    return { code: 'PUSH2', args: [first, second] };
})
CP0Auto.insertHex('540', 12, (slice) => {
    let args = slice.loadUint(12);
    let first = args >> 8 & 0xf;
    let second = args >> 4 & 0xf;
    let third = args & 0xf;
    return { code: 'XCHG3', args: [first, second, third] }
});
CP0Auto.insertHex('541', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return { code: 'XC2PU', args: [i, j, k] };
});
CP0Auto.insertHex('542', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return { code: 'XCPUXC', args: [i, j, k + 1] };
});
CP0Auto.insertHex('543', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return { code: 'XCPU2', args: [i, j, k] };
});
CP0Auto.insertHex('544', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return { code: 'PUXC2', args: [i, j + 1, k + 1] };
});
CP0Auto.insertHex('545', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return { code: 'PUXCPU', args: [i, j + 1, k + 1] };
});
CP0Auto.insertHex('546', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return { code: 'PU2XC', args: [i, j + 1, k + 2] };
});
CP0Auto.insertHex('547', 12, (slice) => {
    let args = slice.loadUint(12);
    let i = args >> 8 & 0xf;
    let j = args >> 4 & 0xf;
    let k = args & 0xf;
    return { code: 'PUSH3', args: [i, j, k] };
});
// 5537792 (DUMMY)
CP0Auto.insertHex('55', 8, (slice) => {
    let args = slice.loadUint(8);
    let i = args >> 4 & 0xf;
    let j = args & 0xf;
    return { code: 'BLKSWAP', args: [i + 1, j + 1] };
});
CP0Auto.insertHex('56', 8, (slice) => {
    let args = slice.loadUint(8);
    return { code: 'PUSH', args: [args] };
});
CP0Auto.insertHex('57', 8, (slice) => {
    let args = slice.loadUint(8);
    return { code: 'POP', args: [args] };
});
CP0Auto.insertHex('58', 8, { code: 'ROT' });
CP0Auto.insertHex('59', 8, { code: 'ROTREV' });
CP0Auto.insertHex('5a', 8, { code: 'SWAP2' });
CP0Auto.insertHex('5b', 8, { code: 'DROP2' });
CP0Auto.insertHex('5c', 8, { code: 'DUP2' });
CP0Auto.insertHex('5d', 8, { code: 'OVER2' });
CP0Auto.insertHex('5e', 8, (slice) => {
    let args = slice.loadUint(8);
    let i = args >> 4 & 0xf;
    let j = args & 0xf;
    return { code: 'REVERSE', args: [i + 2, j] };
});
CP0Auto.insertHex('5f', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    if (i === 0) {
        return { code: 'BLKDROP', args: [j] };
    }
    return { code: 'BLKPUSH', args: [i, j] };
});
CP0Auto.insertHex('60', 8, { code: 'PICK' });
CP0Auto.insertHex('61', 8, { code: 'ROLLX' });
CP0Auto.insertHex('62', 8, { code: 'ROLLREVX' });
CP0Auto.insertHex('63', 8, { code: 'BLKSWX' });
CP0Auto.insertHex('64', 8, { code: 'REVX' });
CP0Auto.insertHex('65', 8, { code: 'DROPX' });
CP0Auto.insertHex('66', 8, { code: 'TUCK' });
CP0Auto.insertHex('67', 8, { code: 'XCHGX' });
CP0Auto.insertHex('68', 8, { code: 'DEPTH' });
CP0Auto.insertHex('69', 8, { code: 'CHKDEPTH' });
CP0Auto.insertHex('6a', 8, { code: 'ONLYTOPX' });
CP0Auto.insertHex('6b', 8, { code: 'ONLYX' });
// 7077888 (DUMMY)
CP0Auto.insertHex('6c', 8, (slice) => {
    let i = slice.loadUint(4);
    let j = slice.loadUint(4);
    return { code: 'BLKDROP2', args: [i, j] };
});
CP0Auto.insertHex('6d', 8, { code: 'NULL' });
CP0Auto.insertHex('6e', 8, { code: 'ISNULL' });
CP0Auto.insertHex('6f0', 12, (slice) => {
    let n = slice.loadUint(4);
    return { code: 'TUPLE', args: [n] };
});
CP0Auto.insertHex('6f1', 12, (slice) => {
    let k = slice.loadUint(4);
    return { code: 'INDEX', args: [k] };
});
CP0Auto.insertHex('6f2', 12, (slice) => {
    let k = slice.loadUint(4);
    return { code: 'UNTUPLE', args: [k] };
});
CP0Auto.insertHex('6f3', 12, (slice) => {
    let k = slice.loadUint(4);
    if (k === 0) {
        return { code: 'CHKTUPLE' };
    }
    return { code: 'UNPACKFIRST', args: [k] };
});
CP0Auto.insertHex('6f4', 12, (slice) => {
    let k = slice.loadUint(4);
    return { code: 'EXPLODE', args: [k] };
});
CP0Auto.insertHex('6f5', 12, (slice) => {
    let k = slice.loadUint(4);
    return { code: 'SETINDEX', args: [k] };
});
CP0Auto.insertHex('6f6', 12, (slice) => {
    let k = slice.loadUint(4);
    return { code: 'INDEXQ', args: [k] };
});
CP0Auto.insertHex('6f7', 12, (slice) => {
    let k = slice.loadUint(4);
    return { code: 'SETINDEXQ', args: [k] };
});
CP0Auto.insertHex('6f80', 16, { code: 'TUPLEVAR' });
CP0Auto.insertHex('6f81', 16, { code: 'INDEXVAR' });
CP0Auto.insertHex('6f82', 16, { code: 'UNTUPLEVAR' });
CP0Auto.insertHex('6f83', 16, { code: 'UNPACKFIRSTVAR' });
CP0Auto.insertHex('6f84', 16, { code: 'EXPLODEVAR' });
CP0Auto.insertHex('6f85', 16, { code: 'SETINDEXVAR' });
CP0Auto.insertHex('6f86', 16, { code: 'INDEXVARQ' });
CP0Auto.insertHex('6f87', 16, { code: 'SETINDEXVARQ' });
CP0Auto.insertHex('6f88', 16, { code: 'TLEN' });
CP0Auto.insertHex('6f89', 16, { code: 'QTLEN' });
CP0Auto.insertHex('6f8a', 16, { code: 'ISTUPLE' });
CP0Auto.insertHex('6f8b', 16, { code: 'LAST' });
CP0Auto.insertHex('6f8c', 16, { code: 'TPUSH' });
CP0Auto.insertHex('6f8d', 16, { code: 'TPOP' });
// 7310848 (DUMMY)
CP0Auto.insertHex('6fa0', 16, { code: 'NULLSWAPIF' });
CP0Auto.insertHex('6fa1', 16, { code: 'NULLSWAPIFNOT' });
CP0Auto.insertHex('6fa2', 16, { code: 'NULLROTRIF' });
CP0Auto.insertHex('6fa3', 16, { code: 'NULLROTRIFNOT' });
CP0Auto.insertHex('6fa4', 16, { code: 'NULLSWAPIF2' });
CP0Auto.insertHex('6fa5', 16, { code: 'NULLSWAPIFNOT2' });
CP0Auto.insertHex('6fa6', 16, { code: 'NULLROTRIF2' });
CP0Auto.insertHex('6fa7', 16, { code: 'NULLROTRIFNOT2' });
// 7317504 (DUMMY)
CP0Auto.insertHex('6fb', 12, (slice) => {
    let i = slice.loadUint(2);
    let j = slice.loadUint(2);
    return { code: 'INDEX2', args: [i, j] };
});
// CP0Auto.insertHex('6fc', 10, (slice) => {
//     let i = slice.loadUint(2);
//     let j = slice.loadUint(2);
//     let k = slice.loadUint(2);
//     return `${i} ${j} ${k} INDEX3`;
// });
CP0Auto.insertHex('7', 4, (slice) => {
    let args = ((slice.loadUint(4) + 5) & 15) - 5;
    return { code: 'PUSHINT', args: [BigInt(args)] };
});
CP0Auto.insertHex('80', 8, (slice) => {
    let x = slice.loadInt(8);
    return { code: 'PUSHINT', args: [BigInt(x)] };
})
CP0Auto.insertHex('81', 8, (slice) => {
    let x = slice.loadInt(16)
    return { code: 'PUSHINT', args: [BigInt(x)] };
})
CP0Auto.insertHex('82', 8, (slice) => {
    let len = slice.loadUint(5)
    let n = 8 * len + 19
    let x = slice.loadIntBig(n)
    return { code: 'PUSHINT', args: [BigInt(x.toString(10))] };
})
CP0Auto.insertHex('83', 8, (slice) => {
    let x = slice.loadUint(8) + 1;
    return { code: 'PUSHPOW2', args: [x] };
})
CP0Auto.insertHex('84', 8, (slice) => {
    let x = slice.loadUint(8) + 1;
    return { code: 'PUSHPOW2DEC', args: [x] };
})
CP0Auto.insertHex('85', 8, (slice) => {
    let x = slice.loadUint(8) + 1;
    return { code: 'PUSHNEGPOW2', args: [x] };
});
// 8781824 (DUMMY)
CP0Auto.insertHex('88', 8, (slice) => ({ code: 'PUSHREF', args: [slice.loadRef()] }));
CP0Auto.insertHex('89', 8, (slice) => ({ code: 'PUSHREFSLICE', args: [slice.loadRef()] }));
CP0Auto.insertHex('8a', 8, (slice) => ({ code: 'PUSHREFCONT', args: [slice.loadRef()] }));
CP0Auto.insertHex('8b', 8, (slice, cell) => {
    let x = slice.loadUint(4);
    let bits = 8 * x + 4;
    let refs = 0;
    let bitsOffset = slice.offsetBits;
    let refsOffset = slice.offsetRefs;
    skipSubslice(slice, bits, refs);
    return { code: 'PUSHSLICE', args: [cell, bitsOffset, refsOffset, bits, refs] };
});
CP0Auto.insertHex('8c', 8, (slice, cell) => {
    let refs = slice.loadUint(2) + 1;
    let bits = (8 * slice.loadUint(5) + 1);
    let bitsOffset = slice.offsetBits;
    let refsOffset = slice.offsetRefs;
    skipSubslice(slice, bits, refs);
    return { code: 'PUSHSLICE', args: [cell, bitsOffset, refsOffset, bits, refs] };
});
CP0Auto.insertHex('8d', 8, (slice, cell) => {
    let refs = slice.loadUint(3);
    let bits = 8 * slice.loadUint(7) + 6;
    let bitsOffset = slice.offsetBits;
    let refsOffset = slice.offsetRefs;
    skipSubslice(slice, bits, refs);
    return { code: 'PUSHSLICE', args: [cell, bitsOffset, refsOffset, bits, refs] };
});
// 9281536 (DUMMY)
CP0Auto.insertHex('8E', 7, (slice, cell) => {
    let args = slice.loadUint(9);
    let refs = (args >> 7) & 3;
    let bits = (args & 127) * 8;
    let bitsOffset = slice.offsetBits;
    let refsOffset = slice.offsetRefs;
    skipSubslice(slice, bits, refs);
    return { code: 'PUSHCONT', args: [cell, bitsOffset, refsOffset, bits, refs] };
})
CP0Auto.insertHex('9', 4, (slice, cell) => {
    let bits = slice.loadUint(4) * 8;
    let refs = 0;
    let bitsOffset = slice.offsetBits;
    let refsOffset = slice.offsetRefs;
    skipSubslice(slice, bits, refs);
    return { code: 'PUSHCONT', args: [cell, bitsOffset, refsOffset, bits, refs] };
})

CP0Auto.insertHex('a0', 8, { code: 'ADD' });
CP0Auto.insertHex('a1', 8, { code: 'SUB' });
CP0Auto.insertHex('a2', 8, { code: 'SUBR' });
CP0Auto.insertHex('a3', 8, { code: 'MULCONST', args: [-1] });
CP0Auto.insertHex('a4', 8, { code: 'ADDCONST', args: [1] });
CP0Auto.insertHex('a5', 8, { code: 'ADDCONST', args: [-1] });
CP0Auto.insertHex('a6', 8, (slice) => {
    let x = slice.loadInt(8);
    return { code: 'ADDCONST', args: [x] };
});
CP0Auto.insertHex('a7', 8, (slice) => {
    let x = slice.loadInt(8);
    return { code: 'MULCONST', args: [x] };
});
CP0Auto.insertHex('a8', 8, { code: 'MUL' });
CP0Auto.insertHex('A9', 8, (slice) => {
    let m = slice.loadBit();
    let s = slice.loadUint(2);
    let c = slice.loadBit();
    let d = slice.loadUint(2);
    let f = slice.loadUint(2);
    return { code: 'DIV', args: [m, s, c, d, f] };
});
// 11079680 (DUMMY)
// 11132928 (DUMMY)
CP0Auto.insertHex('aa', 8, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'LSHIFT', args: [cc + 1] }
});
CP0Auto.insertHex('ab', 8, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'RSHIFT', args: [cc + 1] }
});
CP0Auto.insertHex('ac', 8, { code: 'LSHIFTX' });
CP0Auto.insertHex('ad', 8, { code: 'RSHIFTX' });
CP0Auto.insertHex('ae', 8, { code: 'POW2' });
// 11468800 (DUMMY)
CP0Auto.insertHex('b0', 8, { code: 'AND' });
CP0Auto.insertHex('b1', 8, { code: 'OR' });
CP0Auto.insertHex('b2', 8, { code: 'XOR' });
CP0Auto.insertHex('b3', 8, { code: 'NOT' });
CP0Auto.insertHex('b4', 8, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'FITS', args: [cc + 1] }
});
CP0Auto.insertHex('b5', 8, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'UFITS', args: [cc + 1] }
});
CP0Auto.insertHex('b600', 16, { code: 'FITSX' });
CP0Auto.insertHex('b601', 16, { code: 'UFITSX' });
CP0Auto.insertHex('b602', 16, { code: 'BITSIZE' });
CP0Auto.insertHex('b603', 16, { code: 'UBITSIZE' });
// 11928576 (DUMMY)
CP0Auto.insertHex('b608', 16, { code: 'MIN' });
CP0Auto.insertHex('b609', 16, { code: 'MAX' });
CP0Auto.insertHex('b60a', 16, { code: 'MINMAX' });
CP0Auto.insertHex('b60b', 16, { code: 'ABS' });
// 11930624 (DUMMY)
CP0Auto.insertHex('b7', 8, { code: 'QUIET' });
// 12043264 (DUMMY)
CP0Auto.insertHex('b8', 8, { code: 'SGN' });
CP0Auto.insertHex('b9', 8, { code: 'LESS' });
CP0Auto.insertHex('ba', 8, { code: 'EQUAL' });
CP0Auto.insertHex('bb', 8, { code: 'LEQ' });
CP0Auto.insertHex('bc', 8, { code: 'GREATER' });
CP0Auto.insertHex('bd', 8, { code: 'NEQ' });
CP0Auto.insertHex('be', 8, { code: 'GEQ' });
CP0Auto.insertHex('bf', 8, { code: 'CMP' });
CP0Auto.insertHex('c0', 8, (slice) => {
    let x = slice.loadInt(8);
    return { code: 'EQINT', args: [x] };
});
CP0Auto.insertHex('c1', 8, (slice) => {
    let x = slice.loadInt(8);
    return { code: 'LESSINT', args: [x] };
});
CP0Auto.insertHex('c2', 8, (slice) => {
    let x = slice.loadInt(8);
    return { code: 'GTINT', args: [x] };
});
CP0Auto.insertHex('c3', 8, (slice) => {
    let x = slice.loadInt(8);
    return { code: 'NEQINT', args: [x] };
});
CP0Auto.insertHex('c4', 8, { code: 'ISNAN' });
CP0Auto.insertHex('c5', 8, { code: 'CHKNAN' });
// 12976128 (DUMMY)
CP0Auto.insertHex('c700', 16, { code: 'SEMPTY' });
CP0Auto.insertHex('c701', 16, { code: 'SDEMPTY' });
CP0Auto.insertHex('c702', 16, { code: 'SREMPTY' });
CP0Auto.insertHex('c703', 16, { code: 'SDFIRST' });
CP0Auto.insertHex('c704', 16, { code: 'SDLEXCMP' });
CP0Auto.insertHex('c705', 16, { code: 'SDEQ' });
// 13043200 (DUMMY)
CP0Auto.insertHex('c708', 16, { code: 'SDPFX' });
CP0Auto.insertHex('c709', 16, { code: 'SDPFXREV' });
CP0Auto.insertHex('c70a', 16, { code: 'SDPPFX' });
CP0Auto.insertHex('c70b', 16, { code: 'SDPPFXREV' });
CP0Auto.insertHex('c70c', 16, { code: 'SDSFX' });
CP0Auto.insertHex('c70d', 16, { code: 'SDSFXREV' });
CP0Auto.insertHex('c70e', 16, { code: 'SDPSFX' });
CP0Auto.insertHex('c70f', 16, { code: 'SDPSFXREV' });
CP0Auto.insertHex('c710', 16, { code: 'SDCNTLEAD0' });
CP0Auto.insertHex('c711', 16, { code: 'SDCNTLEAD1' });
CP0Auto.insertHex('c712', 16, { code: 'SDCNTTRAIL0' });
CP0Auto.insertHex('c713', 16, { code: 'SDCNTTRAIL1' });
// 13046784 (DUMMY)
CP0Auto.insertHex('c8', 8, { code: 'NEWC' });
CP0Auto.insertHex('c9', 8, { code: 'ENDC' });
CP0Auto.insertHex('ca', 8, (slice) => {
    let cc = slice.loadUint(8) + 1;
    return { code: 'STI', args: [cc] };
});
CP0Auto.insertHex('cb', 8, (slice) => {
    let cc = slice.loadUint(8) + 1;
    return { code: 'STU', args: [cc] };
});
CP0Auto.insertHex('cc', 8, { code: 'STREF' });
CP0Auto.insertHex('cd', 8, { code: 'STBREFR' });
CP0Auto.insertHex('ce', 8, { code: 'STSLICE' });
CP0Auto.insertHex('cf00', 16, { code: 'STIX' });
CP0Auto.insertHex('cf01', 16, { code: 'STUX' });
CP0Auto.insertHex('cf02', 16, { code: 'STIXR' });
CP0Auto.insertHex('cf03', 16, { code: 'STUXR' });
CP0Auto.insertHex('cf04', 16, { code: 'STIXQ' });
CP0Auto.insertHex('cf05', 16, { code: 'STUXQ' });
CP0Auto.insertHex('cf06', 16, { code: 'STIXRQ' });
CP0Auto.insertHex('cf07', 16, { code: 'STUXRQ' });
CP0Auto.insertHex('cf08', 16, (slice) => {
    let n = slice.loadUint(8);
    return { code: 'STI', args: [n + 1] };
});
CP0Auto.insertHex('cf09', 16, (slice) => {
    let n = slice.loadUint(8);
    return { code: 'STU', args: [n + 1] };
});
CP0Auto.insertHex('cf0a', 16, (slice) => {
    let n = slice.loadUint(8);
    return { code: 'STIR', args: [n + 1] };
});
CP0Auto.insertHex('cf0b', 16, (slice) => {
    let n = slice.loadUint(8);
    return { code: 'STUR', args: [n + 1] };
});
CP0Auto.insertHex('cf0c', 16, (slice) => {
    let n = slice.loadUint(8);
    return { code: 'STIQ', args: [n + 1] };
});
CP0Auto.insertHex('cf0d', 16, (slice) => {
    let n = slice.loadUint(8);
    return { code: 'STUQ', args: [n + 1] };
});
CP0Auto.insertHex('cf0e', 16, (slice) => {
    let n = slice.loadUint(8);
    return { code: 'STIRQ', args: [n + 1] };
});
CP0Auto.insertHex('cf0f', 16, (slice) => {
    let n = slice.loadUint(8);
    return { code: 'STURQ', args: [n + 1] };
});
CP0Auto.insertHex('cf10', 16, { code: 'STREF' });
CP0Auto.insertHex('cf11', 16, { code: 'STBREF' });
CP0Auto.insertHex('cf12', 16, { code: 'STSLICE' });
CP0Auto.insertHex('cf13', 16, { code: 'STB' });
CP0Auto.insertHex('cf14', 16, { code: 'STREFR' });
CP0Auto.insertHex('cf15', 16, { code: 'STBREFR' });
CP0Auto.insertHex('cf16', 16, { code: 'STSLICER' });
CP0Auto.insertHex('cf17', 16, { code: 'STBR' });
CP0Auto.insertHex('cf18', 16, { code: 'STREFQ' });
CP0Auto.insertHex('cf19', 16, { code: 'STBREFQ' });
CP0Auto.insertHex('cf1a', 16, { code: 'STSLICEQ' });
CP0Auto.insertHex('cf1b', 16, { code: 'STBQ' });
CP0Auto.insertHex('cf1c', 16, { code: 'STREFRQ' });
CP0Auto.insertHex('cf1d', 16, { code: 'STBREFRQ' });
CP0Auto.insertHex('cf1e', 16, { code: 'STSLICERQ' });
CP0Auto.insertHex('cf1f', 16, { code: 'STBRQ' });
CP0Auto.insertHex('cf20', 15, (slice) => {
    let flag = slice.loadUint(1);
    if (flag === 0) {
        return { code: 'STREFCONST' };
    } else {
        return { code: 'STREF2CONST' };
    }
});
// 13574656 (DUMMY)
CP0Auto.insertHex('cf23', 16, { code: 'ENDXC' });
// 13575168 (DUMMY)
CP0Auto.insertHex('cf28', 14, (slice) => {
    let args = slice.loadUint(2);
    let sgnd = !(args & 1);
    return { code: `ST${(sgnd ? 'I' : 'U')}LE${((args & 2) ? '8' : '4')}` };
});
// 13577216 (DUMMY)
CP0Auto.insertHex('cf30', 16, { code: 'BDEPTH' });
CP0Auto.insertHex('cf31', 16, { code: 'BBITS' });
CP0Auto.insertHex('cf32', 16, { code: 'BREFS' });
CP0Auto.insertHex('cf33', 16, { code: 'BBITREFS' });
// 13579264 (DUMMY)
CP0Auto.insertHex('cf35', 16, { code: 'BREMBITS' });
CP0Auto.insertHex('cf36', 16, { code: 'BREMREFS' });
CP0Auto.insertHex('cf37', 16, { code: 'BREMBITREFS' });
CP0Auto.insertHex('cf38', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'BCHKBITS', args: [cc + 1] };
});
CP0Auto.insertHex('cf39', 16, { code: 'BCHKBITSX' });
CP0Auto.insertHex('cf3a', 16, { code: 'BCHKREFS' });
CP0Auto.insertHex('cf3b', 16, { code: 'BCHKBITREFS' });
CP0Auto.insertHex('cf3c', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'BCHKBITSQ', args: [cc + 1] };
});
CP0Auto.insertHex('cf3d', 16, { code: 'BCHKBITSQX' });
CP0Auto.insertHex('cf3e', 16, { code: 'BCHKREFSQ' });
CP0Auto.insertHex('cf3f', 16, { code: 'BCHKBITREFSQ' });
CP0Auto.insertHex('cf40', 16, { code: 'STZEROES' });
CP0Auto.insertHex('cf41', 16, { code: 'STONES' });
CP0Auto.insertHex('cf42', 16, { code: 'STSAME' });
// 13583104 (DUMMY)
CP0Auto.insertHex('cf8', 9, (slice, cell) => {
    let refs = slice.loadUint(2);
    let bits = slice.loadUint(3) * 8 + 1;
    let bitsOffset = slice.offsetBits;
    let refsOffset = slice.offsetRefs;
    skipSubslice(slice, bits, refs);
    return { code: `STSLICECONST`, args: [cell, bitsOffset, refsOffset, bits, refs] };
});
CP0Auto.insertHex('d0', 8, { code: 'CTOS' });
CP0Auto.insertHex('d1', 8, { code: 'ENDS' });
CP0Auto.insertHex('d2', 8, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'LDI', args: [cc + 1] };
});
CP0Auto.insertHex('d3', 8, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'LDU', args: [cc + 1] };
});
CP0Auto.insertHex('d4', 8, { code: 'LDREF' });
CP0Auto.insertHex('d5', 8, { code: 'LDREFRTOS' });
CP0Auto.insertHex('d6', 8, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'LDSLICE', args: [cc + 1] };
});

CP0Auto.insertHex('d700', 16, { code: 'LDIX' });
CP0Auto.insertHex('d701', 16, { code: 'LDUX' });
CP0Auto.insertHex('d702', 16, { code: 'PLDIX' });
CP0Auto.insertHex('d703', 16, { code: 'PLDUX' });
CP0Auto.insertHex('d704', 16, { code: 'LDIXQ' });
CP0Auto.insertHex('d705', 16, { code: 'LDUXQ' });
CP0Auto.insertHex('d706', 16, { code: 'PLDIXQ' });
CP0Auto.insertHex('d707', 16, { code: 'PLDUXQ' });
CP0Auto.insertHex('D708', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'LDI', args: [cc + 1] };
});
CP0Auto.insertHex('D709', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'LDU', args: [cc + 1] };
});
CP0Auto.insertHex('D70A', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'PLDI', args: [cc + 1] };
});
CP0Auto.insertHex('D70B', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'PLDU', args: [cc + 1] };
});
CP0Auto.insertHex('D70C', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'LDIQ', args: [cc + 1] };
});
CP0Auto.insertHex('D70D', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'LDUQ', args: [cc + 1] };
});
CP0Auto.insertHex('D70E', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'PLDIQ', args: [cc + 1] };
});
CP0Auto.insertHex('D70F', 16, (slice) => {
    let cc = slice.loadUint(8);
    return { code: 'PLDUQ', args: [cc + 1] };
});
CP0Auto.insertHex('d710', 13, (slice) => {
    let c = slice.loadUint(3) + 1;
    return { code: 'PLDUZ', args: [32 * (c + 1)] };
});
CP0Auto.insertHex('d718', 14, (slice) => {
    let quiet = slice.loadBit();
    let preload = slice.loadBit();
    return { code: `${preload ? 'PLD' : 'LD'}SLICEX${quiet ? 'Q' : ''}` };
});
CP0Auto.insertHex('d71c', 14, (slice) => {
    let quiet = slice.loadBit();
    let preload = slice.loadBit();
    let cc = slice.loadUint(8);
    return { code: `${preload ? 'PLD' : 'LD'}SLICEX${quiet ? 'Q' : ''}`, args: [cc + 1] };
});
CP0Auto.insertHex('d720', 16, { code: 'SDCUTFIRST' });
CP0Auto.insertHex('d721', 16, { code: 'SDSKIPFIRST' });
CP0Auto.insertHex('d722', 16, { code: 'SDCUTLAST' });
CP0Auto.insertHex('d723', 16, { code: 'SDSKIPLAST' });
CP0Auto.insertHex('d724', 16, { code: 'SDSUBSTR' });
// 14099712 (DUMMY)
CP0Auto.insertHex('d726', 16, { code: 'SDBEGINSX' });
CP0Auto.insertHex('d727', 16, { code: 'SDBEGINSXQ' });
CP0Auto.insertHex('d728', 13, (slice) => {
    let args = slice.loadUint(8);
    return { code: 'SDBEGINS', args: [args] };
});
CP0Auto.insertHex('d730', 16, { code: 'SCUTFIRST' });
CP0Auto.insertHex('d731', 16, { code: 'SSKIPFIRST' });
CP0Auto.insertHex('d732', 16, { code: 'SCUTLAST' });
CP0Auto.insertHex('d733', 16, { code: 'SSKIPLAST' });
CP0Auto.insertHex('d734', 16, { code: 'SUBSLICE' });
// 14103808 (DUMMY)
CP0Auto.insertHex('d736', 16, { code: 'SPLIT' });
CP0Auto.insertHex('d737', 16, { code: 'SPLITQ' });
// 14104576 (DUMMY)
CP0Auto.insertHex('d739', 16, { code: 'XCTOS' });
CP0Auto.insertHex('d73a', 16, { code: 'XLOAD' });
CP0Auto.insertHex('d73b', 16, { code: 'XLOADQ' });
// 14105600 (DUMMY)
CP0Auto.insertHex('d741', 16, { code: 'SCHKBITS' });
CP0Auto.insertHex('d742', 16, { code: 'SCHKREFS' });
CP0Auto.insertHex('d743', 16, { code: 'SCHKBITREFS' });
// 14107648 (DUMMY)
CP0Auto.insertHex('d745', 16, { code: 'SCHKBITSQ' });
CP0Auto.insertHex('d746', 16, { code: 'SCHKREFSQ' });
CP0Auto.insertHex('d747', 16, { code: 'SCHKBITREFSQ' });
CP0Auto.insertHex('d748', 16, { code: 'PLDREFVAR' });
CP0Auto.insertHex('d749', 16, { code: 'SBITS' });
CP0Auto.insertHex('d74a', 16, { code: 'SREFS' });
CP0Auto.insertHex('d74b', 16, { code: 'SBITREFS' });
CP0Auto.insertHex('d74c', 14, (slice) => {
    let n = slice.loadUint(2);
    return { code: 'PLDREFIDX', args: [n] };
});
CP0Auto.insertHex('d750', 12, (slice) => {
    let quiet = slice.loadBit();
    let preload = slice.loadBit();
    let bit64 = slice.loadBit();
    let unsigned = slice.loadBit();
    return { code: `${preload ? 'PLD' : 'LD'}${unsigned ? 'U' : 'I'}LE${bit64 ? '8' : '4'}${quiet ? 'Q' : ''}` };
});
CP0Auto.insertHex('d760', 16, { code: 'LDZEROES' });
CP0Auto.insertHex('d761', 16, { code: 'LDONES' });
CP0Auto.insertHex('d762', 16, { code: 'LDSAME' });
// 14115584 (DUMMY)
CP0Auto.insertHex('d764', 16, { code: 'SDEPTH' });
CP0Auto.insertHex('d765', 16, { code: 'CDEPTH' });
// 14116352 (DUMMY)
CP0Auto.insertHex('d8', 8, { code: 'EXECUTE' });
CP0Auto.insertHex('d9', 8, { code: 'JMPX' });
CP0Auto.insertHex('da', 8, (slice) => {
    let p = slice.loadUint(4);
    let r = slice.loadUint(4);
    return { code: `CALLXARGS`, args: [p, r] };
});
CP0Auto.insertHex('db0', 12, (slice) => {
    let p = slice.loadUint(4);
    return { code: `CALLXARGS`, args: [p, -1] };
});
CP0Auto.insertHex('db1', 12, (slice) => {
    let p = slice.loadUint(4);
    return { code: `JMPXARGS`, args: [p] };
});
CP0Auto.insertHex('db2', 12, (slice) => {
    let r = slice.loadUint(4);
    return { code: `RETARGS`, args: [r] };
});
CP0Auto.insertHex('db30', 16, { code: 'RET' });
CP0Auto.insertHex('db31', 16, { code: 'RETFALSE' });
CP0Auto.insertHex('db32', 16, { code: 'RETBOOL' });
// 14365440 (DUMMY)
CP0Auto.insertHex('db34', 16, { code: 'CALLCC' });
CP0Auto.insertHex('db35', 16, { code: 'JMPXDATA' });
CP0Auto.insertHex('db36', 16, (slice) => {
    let p = slice.loadUint(4);
    let r = slice.loadUint(4);
    return { code: 'CALLCCARGS', args: [p, r] };
});
// 14366464 (DUMMY)
CP0Auto.insertHex('db38', 16, { code: 'CALLXVARARGS' });
CP0Auto.insertHex('db39', 16, { code: 'RETVARARGS' });
CP0Auto.insertHex('db3a', 16, { code: 'JMPXVARARGS' });
CP0Auto.insertHex('db3b', 16, { code: 'CALLCCVARARGS' });
CP0Auto.insertHex('db3c', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'CALLREF', args: [subslice] };
});
CP0Auto.insertHex('db3d', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'JMPREF', args: [subslice] };
});
CP0Auto.insertHex('db3e', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'JMPREFDATA', args: [subslice] };
});
CP0Auto.insertHex('db3f', 16, { code: 'RETDATA' });
// 14368768 (DUMMY)
CP0Auto.insertHex('dc', 8, { code: 'IFRET' });
CP0Auto.insertHex('dd', 8, { code: 'IFNOTRET' });
CP0Auto.insertHex('de', 8, { code: 'IF' });
CP0Auto.insertHex('df', 8, { code: 'IFNOT' });
CP0Auto.insertHex('e0', 8, { code: 'IFJMP' });
CP0Auto.insertHex('e1', 8, { code: 'IFNOTJMP' });
CP0Auto.insertHex('e2', 8, { code: 'IFELSE' });
CP0Auto.insertHex('e300', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'IFREF', args: [subslice] };
});
CP0Auto.insertHex('e301', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'IFNOTREF', args: [subslice] };
});
CP0Auto.insertHex('e302', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'IFJMPREF', args: [subslice] };
});
CP0Auto.insertHex('e303', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'IFNOTJMPREF', args: [subslice] };
});
CP0Auto.insertHex('e304', 16, { code: 'CONDSEL' });
CP0Auto.insertHex('e305', 16, { code: 'CONDSELCHK' });
// 14878208 (DUMMY)
CP0Auto.insertHex('e308', 16, { code: 'IFRETALT' });
CP0Auto.insertHex('e309', 16, { code: 'IFNOTRETALT' });
// 14879232 (DUMMY)
CP0Auto.insertHex('e30d', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'IFREFELSE', args: [subslice] }
});
CP0Auto.insertHex('e30e', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'IFELSEREF', args: [subslice] }
});
CP0Auto.insertHex('e30f', 16, (slice) => {
    let subslice = slice.loadRef();
    return { code: 'IFREFELSEREF', args: [subslice] }
});
// 14880768 (DUMMY)
CP0Auto.insertHex('e314', 16, { code: 'REPEATBRK' });
CP0Auto.insertHex('e315', 16, { code: 'REPEATENDBRK' });
CP0Auto.insertHex('e316', 16, { code: 'UNTILBRK' });
CP0Auto.insertHex('e317', 16, { code: 'UNTILENDBRK' });
CP0Auto.insertHex('e318', 16, { code: 'WHILEBRK' });
CP0Auto.insertHex('e319', 16, { code: 'WHILEENDBRK' });
CP0Auto.insertHex('e31a', 16, { code: 'AGAINBRK' });
CP0Auto.insertHex('e31b', 16, { code: 'AGAINENDBRK' });
// 14883840 (DUMMY)
// CP0Auto.insertHex('e38', 10, (slice) => {
//     let args = slice.loadUint(6);
//     return '(FIXED 879)';
// });
// CP0Auto.insertHex('e3c', 10, (slice) => {
//     let args = slice.loadUint(6);
//     return '(EXT)';
// });
CP0Auto.insertHex('e4', 8, { code: 'REPEAT' });
CP0Auto.insertHex('e5', 8, { code: 'REPEATEND' });
CP0Auto.insertHex('e6', 8, { code: 'UNTIL' });
CP0Auto.insertHex('e7', 8, { code: 'UNTILEND' });
CP0Auto.insertHex('e8', 8, { code: 'WHILE' });
CP0Auto.insertHex('e9', 8, { code: 'WHILEEND' });
CP0Auto.insertHex('ea', 8, { code: 'AGAIN' });
CP0Auto.insertHex('eb', 8, { code: 'AGAINEND' });
CP0Auto.insertHex('ec', 8, (slice) => {
    let r = slice.loadUint(4);
    let n = slice.loadUint(4);
    return { code: 'SETCONTARGS', args: [r, n] };
});
CP0Auto.insertHex('ed0', 12, (slice) => {
    let p = slice.loadUint(4);
    return { code: 'RETURNARGS', args: [p] };
});
CP0Auto.insertHex('ed10', 16, { code: 'RETURNVARARGS' });
CP0Auto.insertHex('ed11', 16, { code: 'SETCONTVARARGS' });
CP0Auto.insertHex('ed12', 16, { code: 'SETNUMVARARGS' });
// 15536896 (DUMMY)
CP0Auto.insertHex('ed1e', 16, { code: 'BLESS' });
CP0Auto.insertHex('ed1f', 16, { code: 'BLESSVARARGS' });
// 15540224 (DUMMY)
CP0Auto.insertHex('ed4', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'PUSHCTR', args: [i] };
});
CP0Auto.insertHex('ed5', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'POPCTR', args: [i] };
});
// 15554560 (DUMMY)
CP0Auto.insertHex('ed6', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'SETCONTCTR', args: [i] };
});
// 15558656 (DUMMY)
CP0Auto.insertHex('ed7', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'SETRETCTR', args: [i] };
});
// 15562752 (DUMMY)
CP0Auto.insertHex('ed8', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'SETALTCTR', args: [i] };
});
// 15566848 (DUMMY)
CP0Auto.insertHex('ed9', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'POPSAVE', args: [i] };
});
// 15570944 (DUMMY)
CP0Auto.insertHex('eda', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'SAVE', args: [i] };
});
CP0Auto.insertHex('edb', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'SAVEALT', args: [i] };
});
CP0Auto.insertHex('edc', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'SAVEBOTH', args: [i] };
});
CP0Auto.insertHex('ede0', 16, { code: 'PUSHCTRX' });
CP0Auto.insertHex('ede1', 16, { code: 'POPCTRX' });
CP0Auto.insertHex('ede2', 16, { code: 'SETCONTCTRX' });
CP0Auto.insertHex('edf0', 16, { code: 'COMPOS' });
CP0Auto.insertHex('edf1', 16, { code: 'COMPOSALT' });
CP0Auto.insertHex('edf2', 16, { code: 'COMPOSBOTH' });
CP0Auto.insertHex('edf3', 16, { code: 'ATEXIT' });
CP0Auto.insertHex('edf4', 16, { code: 'ATEXITALT' });
CP0Auto.insertHex('edf5', 16, { code: 'SETEXITALT' });
CP0Auto.insertHex('edf6', 16, { code: 'THENRET' });
CP0Auto.insertHex('edf7', 16, { code: 'THENRETALT' });
CP0Auto.insertHex('edf8', 16, { code: 'INVERT' });
CP0Auto.insertHex('edf9', 16, { code: 'BOOLEVAL' });
CP0Auto.insertHex('edfa', 16, { code: 'SAMEALT' });
CP0Auto.insertHex('edfb', 16, { code: 'SAMEALTSAVE' });
// 15596544 (DUMMY)
CP0Auto.insertHex('ee', 8, (slice) => {
    let r = slice.loadUint(4);
    let n = slice.loadUint(4);
    return { code: 'BLESSARGS', args: [r, n] };
});
// 15663104 (DUMMY)
CP0Auto.insertHex('f0', 8, (slice) => {
    let n = slice.loadUint(8);
    return { code: 'CALL', args: [n] };
});
CP0Auto.insertHex('f10', 10, (slice) => {
    let n = slice.loadUint(14);
    return { code: 'CALL', args: [n] };
});
// CP0Auto.insertHex('f14', 10, (slice) => {
//     let args = slice.loadUint(14);
//     return '(FIXED 1047)';
// });
// CP0Auto.insertHex('f18', 10, (slice) => {
//     let args = slice.loadUint(14);
//     return '(FIXED 1051)';
// });
// 15843328 (DUMMY)
CP0Auto.insertHex('f20', 10, (slice) => {
    let nn = slice.loadUint(6);
    return { code: 'THROW', args: [nn] };
});
CP0Auto.insertHex('F24', 10, (slice) => {
    let eCode = slice.loadUint(6)
    return { code: 'THROWIF', args: [eCode] };
})
CP0Auto.insertHex('F28', 10, (slice) => {
    let eCode = slice.loadUint(6)
    return { code: 'THROWIFNOT', args: [eCode] };
})
CP0Auto.insertHex('f2c0', 13, (slice) => {
    let x = slice.loadUint(11);
    return { code: 'THROW', args: [x] };
});
CP0Auto.insertHex('f2c8', 13, (slice) => {
    let x = slice.loadUint(11);
    return { code: 'THROWARG', args: [x] };
});
CP0Auto.insertHex('f2d0', 13, (slice) => {
    let x = slice.loadUint(11);
    return { code: 'THROWIF', args: [x] };
});
// CP0Auto.insertHex('f2d8', 13, (slice) => {
//     let args = slice.loadUint(11);
//     return '(FIXED 1080)';
// });
CP0Auto.insertHex('f2e0', 13, (slice) => {
    let x = slice.loadUint(11);
    return { code: 'THROWIFNOT', args: [x] };
});
// CP0Auto.insertHex('f2e8', 13, (slice) => {
//     let args = slice.loadUint(11);
//     return '(FIXED 1088)';
// });
CP0Auto.insertHex('f2f0', 16, { code: 'THROWANY' });
CP0Auto.insertHex('f2f1', 16, { code: 'THROWARGANY' });
CP0Auto.insertHex('f2f2', 16, { code: 'THROWANYIF' });
CP0Auto.insertHex('f2f3', 16, { code: 'THROWARGANYIF' });
CP0Auto.insertHex('f2f4', 16, { code: 'THROWANYIFNOT' });
CP0Auto.insertHex('f2f5', 16, { code: 'THROWARGANYIFNOT' });

// 15922688 (DUMMY)
CP0Auto.insertHex('f2ff', 16, { code: 'TRY' });
CP0Auto.insertHex('f3', 8, (slice) => {
    let p = slice.loadUint(4);
    let r = slice.loadUint(4);
    return { code: 'TRYARGS', args: [p, r] };
});
CP0Auto.insertHex('f400', 16, { code: 'STDICT' });
CP0Auto.insertHex('f401', 16, { code: 'SKIPDICT' });
CP0Auto.insertHex('f402', 16, { code: 'LDDICTS' });
CP0Auto.insertHex('f403', 16, { code: 'PLDDICTS' });
CP0Auto.insertHex('f404', 16, { code: 'LDDICT' });
CP0Auto.insertHex('f405', 16, { code: 'PLDDICT' });
CP0Auto.insertHex('f406', 16, { code: 'LDDICTQ' });
CP0Auto.insertHex('f407', 16, { code: 'PLDDICTQ' });
// 15992832 (DUMMY)

CP0Auto.insertHex('f40a', 16, { code: 'DICTGET' });
CP0Auto.insertHex('f40b', 16, { code: 'DICTGETREF' });
CP0Auto.insertHex('f40c', 16, { code: 'DICTIGET' });
CP0Auto.insertHex('f40d', 16, { code: 'DICTIGETREF' });
CP0Auto.insertHex('f40e', 16, { code: 'DICTUGET' });
CP0Auto.insertHex('f40f', 16, { code: 'DICTUGETREF' });
CP0Auto.insertHex('f412', 16, { code: 'DICTSET' });
CP0Auto.insertHex('f413', 16, { code: 'DICTSETREF' });
CP0Auto.insertHex('f414', 16, { code: 'DICTISET' });
CP0Auto.insertHex('f415', 16, { code: 'DICTISETREF' });
CP0Auto.insertHex('f416', 16, { code: 'DICTUSET' });
CP0Auto.insertHex('f417', 16, { code: 'DICTUSETREF' });
CP0Auto.insertHex('f41a', 16, { code: 'DICTSETGET' });
CP0Auto.insertHex('f41B', 16, { code: 'DICTSETGETREF' });
CP0Auto.insertHex('f41C', 16, { code: 'DICTISETGET' });
CP0Auto.insertHex('f41D', 16, { code: 'DICTISETGETREF' });
CP0Auto.insertHex('f41E', 16, { code: 'DICTUSETGET' });
CP0Auto.insertHex('f41F', 16, { code: 'DICTUSETGETREF' });
CP0Auto.insertHex('f422', 16, { code: 'DICTREPLACE' });
CP0Auto.insertHex('f423', 16, { code: 'DICTREPLACEREF' });
CP0Auto.insertHex('f424', 16, { code: 'DICTIREPLACE' });
CP0Auto.insertHex('f425', 16, { code: 'DICTIREPLACEREF' });
CP0Auto.insertHex('f426', 16, { code: 'DICTUREPLACE' });
CP0Auto.insertHex('f427', 16, { code: 'DICTUREPLACEREF' });
CP0Auto.insertHex('f42a', 16, { code: 'DICTREPLACEGET' });
CP0Auto.insertHex('f42b', 16, { code: 'DICTREPLACEGETREF' });
CP0Auto.insertHex('f42c', 16, { code: 'DICTIREPLACEGET' });
CP0Auto.insertHex('f42c', 16, { code: 'DICTIREPLACEGET' });
CP0Auto.insertHex('f42d', 16, { code: 'DICTIREPLACEGETREF' });
CP0Auto.insertHex('f42e', 16, { code: 'DICTUREPLACEGET' });
CP0Auto.insertHex('f42f', 16, { code: 'DICTUREPLACEGETREF' });
CP0Auto.insertHex('f432', 16, { code: 'DICTADD' });
CP0Auto.insertHex('f433', 16, { code: 'DICTADDREF' });
CP0Auto.insertHex('f434', 16, { code: 'DICTIADD' });
CP0Auto.insertHex('f435', 16, { code: 'DICTIADDREF' });
CP0Auto.insertHex('f436', 16, { code: 'DICTUADD' });
CP0Auto.insertHex('f437', 16, { code: 'DICTUADDREF' });
CP0Auto.insertHex('f43a', 16, { code: 'DICTADDGET' });
CP0Auto.insertHex('f43b', 16, { code: 'DICTADDGETREF' });
CP0Auto.insertHex('f43c', 16, { code: 'DICTIADDGET' });
CP0Auto.insertHex('f43d', 16, { code: 'DICTIADDGETREF' });
CP0Auto.insertHex('f43e', 16, { code: 'DICTUADDGET' });
CP0Auto.insertHex('f43f', 16, { code: 'DICTUADDGETREF' });


CP0Auto.insertHex('f441', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return { code: `DICT${int ? (usign ? 'U' : 'I') : ''}SETB` };
});
// 16008192 (DUMMY)
CP0Auto.insertHex('f445', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return { code: `DICT${int ? (usign ? 'U' : 'I') : ''}SETGETB` };
});
// 16009216 (DUMMY)
CP0Auto.insertHex('f449', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return { code: `DICT${int ? (usign ? 'U' : 'I') : ''}REPLACEB` };
});
// 16010240 (DUMMY)
CP0Auto.insertHex('f44d', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return { code: `DICT${int ? (usign ? 'U' : 'I') : ''}REPLACEGETB` };
});
// 16011264 (DUMMY)
CP0Auto.insertHex('f451', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return { code: `DICT${int ? (usign ? 'U' : 'I') : ''}ADDB` };
});
// 16012288 (DUMMY)
CP0Auto.insertHex('f455', 14, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    return { code: `DICT${int ? (usign ? 'U' : 'I') : ''}ADDGETB` };
});
// 16013312 (DUMMY)
CP0Auto.insertHex('f459', 16, { code: 'DICTDEL' });
CP0Auto.insertHex('f45A', 16, { code: 'DICTIDEL' });
CP0Auto.insertHex('f45B', 16, { code: 'DICTUDEL' });

// 16014336 (DUMMY)
CP0Auto.insertHex('f462', 13, (slice) => {
    let int = slice.loadBit();
    let usign = slice.loadBit();
    let ref = slice.loadBit();
    return { code: `DICT${int ? (usign ? 'U' : 'I') : ''}DELGET${ref ? 'REF' : ''}` };
});
// 16017408 (DUMMY)
CP0Auto.insertHex('f469', 16, { code: 'DICTGETOPTREF' });
CP0Auto.insertHex('f46A', 16, { code: 'DICTIGETOPTREF' });
CP0Auto.insertHex('f46B', 16, { code: 'DICTUGETOPTREF' });

CP0Auto.insertHex('f46d', 16, { code: 'DICTSETGETOPTREF' });
CP0Auto.insertHex('f46e', 16, { code: 'DICTISETGETOPTREF' });
CP0Auto.insertHex('f46f', 16, { code: 'DICTUSETGETOPTREF' });

CP0Auto.insertHex('f470', 16, { code: 'PFXDICTSET' });
CP0Auto.insertHex('f471', 16, { code: 'PFXDICTREPLACE' });
CP0Auto.insertHex('f472', 16, { code: 'PFXDICTADD' });
CP0Auto.insertHex('f473', 16, { code: 'PFXDICTDEL' });

CP0Auto.insertHex('f474', 16, { code: 'DICTGETNEXT' });
CP0Auto.insertHex('f475', 16, { code: 'DICTGETNEXTEQ' });
CP0Auto.insertHex('f476', 16, { code: 'DICTGETPREV' });
CP0Auto.insertHex('f477', 16, { code: 'DICTGETPREVEQ' });
CP0Auto.insertHex('f478', 16, { code: 'DICTIGETNEXT' });
CP0Auto.insertHex('f479', 16, { code: 'DICTIGETNEXTEQ' });
CP0Auto.insertHex('f47a', 16, { code: 'DICTIGETPREV' });
CP0Auto.insertHex('f47b', 16, { code: 'DICTIGETPREVEQ' });
CP0Auto.insertHex('f47c', 16, { code: 'DICTUGETNEXT' });
CP0Auto.insertHex('f47d', 16, { code: 'DICTUGETNEXTEQ' });
CP0Auto.insertHex('f47e', 16, { code: 'DICTUGETPREV' });
CP0Auto.insertHex('f47f', 16, { code: 'DICTUGETPREVEQ' });

CP0Auto.insertHex('f48', 11, (slice) => {
    let remove = slice.loadBit();
    let max = slice.loadBit();
    let int = slice.loadBit();
    let usign = slice.loadBit();
    let ref = slice.loadBit();
    return { code: `DICT${int ? (usign ? 'U' : 'I') : ''}${remove ? 'REM' : ''}${max ? 'MAX' : 'MIN'}${ref ? 'REF' : ''}` };
});
CP0Auto.insertHex('f4a0', 13, (slice) => {
    let push = slice.loadBit();
    if (push) {
        // let subslice = fetchSubslice(slice, 0, 1);
        let keyLen = slice.loadUint(10);
        return { code: 'DICTPUSHCONST', args: [keyLen, slice.loadRef()] };
    }
    let exec = slice.loadBit();
    let usign = slice.loadBit();
    return { code: `DICT${usign ? 'U' : 'I'}GET${exec ? 'EXEC' : 'JMP'}` };
});
CP0Auto.insertHex('f4a8', 16, { code: 'PFXDICTGETQ' });
CP0Auto.insertHex('f4a9', 16, { code: 'PFXDICTGET' });
CP0Auto.insertHex('f4aa', 16, { code: 'PFXDICTGETJMP' });
CP0Auto.insertHex('f4ab', 16, { code: 'PFXDICTGETEXEC' });
// CP0Auto.insertHex('f4ac00', 13, (slice) => {
//     let args = slice.loadUint(11);
//     return '(EXT)';
// });
// 16035840 (DUMMY)
// CP0Auto.insertHex('f4b1', 13, (slice) => {
//     let int = slice.loadBit();
//     let usign = slice.loadBit();
//     let ref = slice.loadBit();
//     return { code: `SUBDICT${int ? (usign ? 'U' : 'I') : ''}GET${ref ? 'REF' : ''}` };
// });
// // 16036864 (DUMMY)
// CP0Auto.insertHex('f4b5', 13, (slice) => {
//     let int = slice.loadBit();
//     let usign = slice.loadBit();
//     let ref = slice.loadBit();
//     return { code: `SUBDICT${int ? (usign ? 'U' : 'I') : ''}RPGET${ref ? 'REF' : ''}` };
// });
// 16037888 (DUMMY)
CP0Auto.insertHex('f4bc', 14, (slice) => {
    let exec = slice.loadBit();
    let unsigned = slice.loadBit();
    return { code: `DICT${unsigned ? 'U' : 'I'}GET${exec ? 'EXEC' : 'JMP'}Z` };
});
// 16039936 (DUMMY)
CP0Auto.insertHex('f800', 16, { code: 'ACCEPT' });
CP0Auto.insertHex('f801', 16, { code: 'SETGASLIMIT' });
// 16253440 (DUMMY)
CP0Auto.insertHex('f80f', 16, { code: 'COMMIT' });
CP0Auto.insertHex('f810', 16, { code: 'RANDU256' });
CP0Auto.insertHex('f811', 16, { code: 'RAND' });
CP0Auto.insertHex('f814', 16, { code: 'SETRAND' });
CP0Auto.insertHex('f815', 16, { code: 'ADDRAND' });
CP0Auto.insertHex('f82', 12, (slice) => {
    let i = slice.loadUint(4);
    return { code: 'GETPARAM', args: [i] };
});
CP0Auto.insertHex('f830', 16, { code: 'CONFIGDICT' });
CP0Auto.insertHex('f832', 16, { code: 'CONFIGPARAM' });
CP0Auto.insertHex('f833', 16, { code: 'CONFIGOPTPARAM' });;
CP0Auto.insertHex('f841', 11, (slice) => {
    let i = slice.loadUint(5);
    return { code: `GETGLOBVAR`, args: [i] };
});
CP0Auto.insertHex('f861', 11, (slice) => {
    let i = slice.loadUint(5);
    return { code: `SETGLOBVAR`, args: [i] };
});
CP0Auto.insertHex('f900', 16, { code: 'HASHCU' });
CP0Auto.insertHex('f901', 16, { code: 'HASHSU' });
CP0Auto.insertHex('f902', 16, { code: 'SHA256U' });
CP0Auto.insertHex('f910', 16, { code: 'CHKSIGNU' });
CP0Auto.insertHex('f911', 16, { code: 'CHKSIGNS' });
CP0Auto.insertHex('f940', 16, { code: 'CDATASIZEQ' });
CP0Auto.insertHex('f941', 16, { code: 'CDATASIZE' });
CP0Auto.insertHex('f942', 16, { code: 'SDATASIZEQ' });
CP0Auto.insertHex('f943', 16, { code: 'SDATASIZE' });
CP0Auto.insertHex('fa00', 16, { code: 'LDGRAMS' });
CP0Auto.insertHex('fa01', 16, { code: 'LDVARINT16' });
CP0Auto.insertHex('fa02', 16, { code: 'STGRAMS' });
CP0Auto.insertHex('fa03', 16, { code: 'STVARINT16' });
CP0Auto.insertHex('fa04', 16, { code: 'LDVARUINT32' });
CP0Auto.insertHex('fa05', 16, { code: 'LDVARINT32' });
CP0Auto.insertHex('fa06', 16, { code: 'STVARUINT32' });
CP0Auto.insertHex('fa07', 16, { code: 'STVARINT32' });
CP0Auto.insertHex('fa40', 16, { code: 'LDMSGADDR' });
CP0Auto.insertHex('fa41', 16, { code: 'LDMSGADDRQ' });
CP0Auto.insertHex('fa42', 16, { code: 'PARSEMSGADDR' });
CP0Auto.insertHex('fa43', 16, { code: 'PARSEMSGADDRQ' });
CP0Auto.insertHex('fa44', 16, { code: 'REWRITESTDADDR' });
CP0Auto.insertHex('fa45', 16, { code: 'REWRITESTDADDRQ' });
CP0Auto.insertHex('fa46', 16, { code: 'REWRITEVARADDR' });
CP0Auto.insertHex('fa47', 16, { code: 'REWRITEVARADDRQ' });
CP0Auto.insertHex('fb00', 16, { code: 'SENDRAWMSG' });
CP0Auto.insertHex('fb02', 16, { code: 'RAWRESERVE' });
CP0Auto.insertHex('fb03', 16, { code: 'RAWRESERVEX' });
CP0Auto.insertHex('fb04', 16, { code: 'SETCODE' });
CP0Auto.insertHex('fb06', 16, { code: 'SETLIBCODE' });
CP0Auto.insertHex('fb07', 16, { code: 'CHANGELIB' });
CP0Auto.insertHex('fe', 8, (slice) => {
    let nn = slice.loadUint(8);
    if ((nn & 0xf0) == 0xf0) {
        let n = nn & 0x0f;
        let str = slice.loadBuffer(n + 1).toString('utf-8');
        return { code: 'DEBUGSTR', args: [str] };
    }
    return { code: 'DEBUG', args: [nn] };
});
CP0Auto.insertHex('ff', 8, (slice) => {
    let nn = slice.loadInt(8);
    return { code: 'SETCP', args: [nn] };
});

export { CP0Auto }

//
// Utils
//

function skipSubslice(slice: Slice, bits: number, refs?: number) {
    slice.skip(bits);
    for (let i = 0; i < (refs || 0); i++) {
        slice.loadRef();
    }
}