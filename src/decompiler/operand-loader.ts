import {BitString, Builder, Cell, Slice} from "@ton/core"
import type {Instruction, Operand} from "../spec/tvm-spec"
import {removeCompletionTag} from "../utils/binutils"
import {PrefixMatcher} from "../utils/prefix-matcher"
import {DisassemblerError} from "./errors"
import {repeat} from "../utils/tricks"

type ExtractType<T extends Operand["type"], A = Operand> = A extends {type: T} ? A : never

export type UintOperand = ExtractType<"uint">
export type IntOperand = ExtractType<"int">
export type PushLongOperand = ExtractType<"pushint_long">
export type SubsliceOperand = ExtractType<"subslice">
export type RefOperand = ExtractType<"ref">

export type NumericOperand = UintOperand | IntOperand

export interface NumericValue {
    readonly type: "numeric"
    readonly definition: NumericOperand
    readonly value: number
    readonly bitcode: BitString
}

export interface BigIntValue {
    readonly type: "bigint"
    readonly definition: PushLongOperand
    readonly value: bigint
    readonly bitcode: BitString
}

export interface RefValue {
    readonly type: "ref"
    readonly definition: RefOperand
    readonly value: Cell
    readonly bitcode: BitString
}

export interface SliceValue {
    readonly type: "subslice"
    readonly definition: SubsliceOperand
    readonly value: Cell
    readonly source: Cell
    readonly offsetBits: number
    readonly offsetRefs: number
    readonly limitBits: number
    readonly limitRefs: number
}

export type OperandValue = NumericValue | BigIntValue | RefValue | SliceValue

export interface DecodedInstruction {
    readonly definition: Instruction
    readonly operands: OperandValue[]
}

export interface DecompiledInstruction {
    readonly op: DecodedInstruction
    readonly hash: string
    readonly offset: number
    readonly length: number
}

const prefixMatcher: PrefixMatcher = new PrefixMatcher()

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
        } catch (error) {
            throw new DisassemblerError(
                `Bad operand ${operand.name} for instruction ${instruction.mnemonic}`,
                {
                    cause: error,
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

    const loadedBits = slice.loadBits(bitLength)
    const bits = operand.completion_tag ? removeCompletionTag(loadedBits) : loadedBits

    const builder = new Builder()
    builder.storeBits(bits)

    repeat(refLength, () => builder.storeRef(slice.loadRef()))

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
