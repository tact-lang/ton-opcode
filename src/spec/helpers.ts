import {DisplayHint} from "./tvm-spec"
import {NumericValue} from "../decompiler/operand-loader"

export function hasHint(displayHints: DisplayHint[], name: string): boolean {
    return displayHints.some(hint => hint.type === name)
}

export function getDisplayNumber(
    operand: NumericValue,
    add: number,
    displayHints: DisplayHint[],
): number {
    const displayNumber = operand.value + add

    if (hasHint(displayHints, "pushint4")) {
        return displayNumber > 10 ? displayNumber - 16 : displayNumber
    }

    if (hasHint(displayHints, "optional_nargs")) {
        return displayNumber === 15 ? -1 : displayNumber
    }

    if (hasHint(displayHints, "plduz")) {
        return 32 * (displayNumber + 1)
    }

    return displayNumber
}
