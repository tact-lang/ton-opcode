import {BitString, Builder, Cell, Slice} from "@ton/core"
import type {Instruction, Operand} from "../spec/tvm-spec"
import {removeCompletionTag} from "../utils/binutils"
import {PrefixMatcher} from "../utils/prefix-matcher"
import {DisassemblerError} from "./errors"

type ExtractType<T extends Operand["type"], A = Operand> = A extends {type: T} ? A : never

export type UintOperand = ExtractType<"uint">
export type IntOperand = ExtractType<"int">
export type PushLongOperand = ExtractType<"pushint_long">
export type SubsliceOperand = ExtractType<"subslice">
export type RefOperand = ExtractType<"ref">

export type NumericOperand = UintOperand | IntOperand

export interface NumericValue {
    type: "numeric"
    definition: NumericOperand
    value: number
    bitcode: BitString
}

export interface BigIntValue {
    type: "bigint"
    definition: PushLongOperand
    value: bigint
    bitcode: BitString
}

export interface RefValue {
    type: "ref"
    definition: RefOperand
    value: Cell
    bitcode: BitString
}

export interface SliceValue {
    type: "subslice"
    definition: SubsliceOperand
    value: Cell
    source: Cell
    offsetBits: number
    offsetRefs: number
    limitBits: number
    limitRefs: number
}

export type OperandValue = NumericValue | BigIntValue | RefValue | SliceValue

const prefixMatcher: PrefixMatcher = new PrefixMatcher()

export interface DecodedInstruction {
    definition: Instruction
    operands: OperandValue[]
}

export interface DecompiledInstruction {
    op: DecodedInstruction
    hash: string
    offset: number
    length: number
}

export function decodeInstruction(source: Cell, slice: Slice): DecodedInstruction {
    const definition = prefixMatcher.loadPrefix(slice)
    const operands = parseInstructions(source, slice, definition)
    return {
        definition,
        operands,
    }
}

export function parseInstructions(
    source: Cell,
    slice: Slice,
    instruction: Instruction,
): OperandValue[] {
    const operands: OperandValue[] = []
    for (const operand of instruction.bytecode.operands) {
        try {
            operands.push(parseInstruction(source, operand, slice))
        } catch (e) {
            throw new DisassemblerError(
                `Bad operand ${operand.name} for instruction ${instruction.mnemonic}`,
                {
                    cause: e,
                },
            )
        }
    }
    return operands
}

function parseInstruction(source: Cell, operand: Operand, slice: Slice): OperandValue {
    const type = operand.type

    if (type === "uint") {
        const raw = slice.clone().loadBits(operand.size)
        return {
            type: "numeric",
            definition: operand,
            bitcode: raw,
            value: slice.loadUint(operand.size),
        }
    }

    if (type === "int") {
        const raw = slice.clone().loadBits(operand.size)
        return {
            type: "numeric",
            definition: operand,
            bitcode: raw,
            value: slice.loadInt(operand.size),
        }
    }

    if (type === "ref") {
        const raw = slice.clone().loadRef()
        return {type: "ref", definition: operand, bitcode: raw.bits, value: slice.loadRef()}
    }

    if (type === "pushint_long") {
        const cloned = slice.clone()

        const prefix = slice.loadUint(5)
        const length = 8 * prefix + 19

        const raw = cloned.loadBits(5 + length)
        return {
            type: "bigint",
            definition: operand,
            bitcode: raw,
            value: slice.loadIntBig(length),
        }
    }

    // Handle remaining subslice type

    const refLength =
        (operand.refs_add ?? 0) +
        (operand.refs_length_var_size ? slice.loadUint(operand.refs_length_var_size) : 0)
    const bitLength =
        operand.bits_padding +
        (operand.bits_length_var_size ? slice.loadUint(operand.bits_length_var_size) * 8 : 0)

    const offsetBits = slice.offsetBits
    const offsetRefs = slice.offsetRefs

    let bits = slice.loadBits(bitLength)
    if (operand.completion_tag) {
        bits = removeCompletionTag(bits)
    }

    const builder = new Builder()
    builder.storeBits(bits)

    for (let i = 0; i < refLength; i++) {
        builder.storeRef(slice.loadRef())
    }

    return {
        type: "subslice",
        definition: operand,
        value: builder.endCell(),
        source: source,
        offsetBits,
        offsetRefs,
        limitBits: bitLength,
        limitRefs: refLength,
    }
}
