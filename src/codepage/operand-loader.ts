import { Builder, Cell, Slice } from "@ton/core";
import { Instruction, Operand } from "./tvm-spec";
import { removeCompletionTag } from "./binutils";

type ExtractType<T extends Operand['type'], A = Operand> = A extends { type: T } ? A : never;

export type UintOperand = ExtractType<'uint'>;
export type IntOperand = ExtractType<'int'>;
export type PushLongOperand = ExtractType<'pushint_long'>;
export type SubsliceOperand = ExtractType<'subslice'>;
export type RefOperand = ExtractType<'ref'>;

export type NumericOperand = UintOperand | IntOperand;

export interface NumericValue {
    type: 'numeric',
    definition: NumericOperand,
    value: number,
}

export interface BigIntValue {
    type: 'bigint',
    definition: PushLongOperand,
    value: bigint,
}

export interface RefValue {
    type: 'ref',
    definition: RefOperand,
    value: Cell,
}

export interface SliceValue {
    type: 'subslice',
    definition: SubsliceOperand,
    value: Cell,
    offsetBits: number,
    offsetRefs: number,
    limitBits: number,
    limitRefs: number,
}

export type OperandValue = NumericValue | BigIntValue | RefValue | SliceValue;

export function loadOperands(slice: Slice, instruction: Instruction): OperandValue[]  {
    let operands = [];
    for (let operand of instruction.bytecode.operands) {
        try {
            operands.push(loadOperand(operand, slice));
        } catch (e) {
            throw new Error(`Bad operand ${operand.name} for instruction ${instruction.mnemonic}`, { cause: e })
        }
    }
    return operands;
}

function loadOperand(operand: Operand, slice: Slice): OperandValue {
    if (operand.type == "uint") {
        return { type: 'numeric', definition: operand, value: slice.loadUint(operand.size) };
    } else if (operand.type == "int") {
        return { type: 'numeric', definition: operand, value: slice.loadInt(operand.size) };
    } else if (operand.type == "ref") {
        return { type: 'ref', definition: operand, value: slice.loadRef() };
    } else if (operand.type == "pushint_long") {
        return { type: 'bigint', definition: operand, value: slice.loadIntBig(8 * slice.loadUint(5) + 19) };
    } else if (operand.type == "subslice") {
        let refLength = (operand.refs_add ?? 0) + (operand.refs_length_var_size ? slice.loadUint(operand.refs_length_var_size) : 0);
        let bitLength = (operand.bits_padding ?? 0) + (operand.bits_length_var_size ? slice.loadUint(operand.bits_length_var_size) * 8 : 0);
        let offsetBits = slice.offsetBits;
        let offsetRefs = slice.offsetRefs;
        let bits = slice.loadBits(bitLength);
        if (operand.completion_tag) {
            bits = removeCompletionTag(bits);
        }
        let builder = new Builder();
        builder.storeBits(bits);
        for (let i = 0; i < refLength; i++) {
            builder.storeRef(slice.loadRef());
        }
        return { type: 'subslice', definition: operand, value: builder.endCell(), offsetBits, offsetRefs, limitBits: bitLength, limitRefs: refLength };
    } else {
        throw new Error('unimplemented');
    }
}