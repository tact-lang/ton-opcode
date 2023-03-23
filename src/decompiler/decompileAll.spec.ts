import { decompileAll } from "./decompileAll";
import { fromCode } from "tvm-disassembler";
import { Cell } from "ton-core";

describe('decompileAll', () => {
    it('should decompile wallet v1', () => {
        const wallet = Buffer.from('te6cckEBAQEARAAAhP8AIN2k8mCBAgDXGCDXCx/tRNDTH9P/0VESuvKhIvkBVBBE+RDyovgAAdMfMSDXSpbTB9QC+wDe0aTIyx/L/8ntVEH98Ik=', 'base64');
        let res = decompileAll({ src: wallet });
        // let res2 = fromCode(Cell.fromBoc(wallet)[0]);
        expect(res).toMatchSnapshot();
        // console.warn(res);
        // console.warn(res2);
        // expect(res).toEqual(res2);
    });

    it('should decompile wallet v2', () => {
        const wallet = Buffer.from('te6cckEBAQEAVwAAqv8AIN0gggFMl7qXMO1E0NcLH+Ck8mCDCNcYINMf0x8B+CO78mPtRNDTH9P/0VExuvKhA/kBVBBC+RDyovgAApMg10qW0wfUAvsA6NGkyMsfy//J7VShNwu2', 'base64');
        let res = decompileAll({ src: wallet });
        let res2 = fromCode(Cell.fromBoc(wallet)[0]);
        expect(res).toMatchSnapshot();
        // console.warn(res);
        // console.warn(res2);
        // expect(res).toEqual(res2);
    });
});