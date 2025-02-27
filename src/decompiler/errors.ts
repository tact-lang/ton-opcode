import {OperandValue} from "./operand-loader"

export class DisassemblerError extends Error {
    public constructor(message: string, details?: Record<string, unknown>) {
        const detailsStr = details
            ? "\nDetails:\n" +
              Object.entries(details)
                  .map(([key, value]) => `  ${key}: ${JSON.stringify(value, null, 2)}`)
                  .join("\n")
            : ""

        super(message + detailsStr)
        this.name = "DisassemblerError"
    }
}

export class OperandError extends DisassemblerError {
    public constructor(
        opcode: string,
        operandName: string,
        expectedType: string,
        details?: Record<string, unknown>,
    ) {
        super(`Cannot find ${expectedType} operand "${operandName}" for "${opcode}"`, {
            opcode,
            operandName,
            expectedType,
            ...details,
        })
        this.name = "OperandError"
    }
}

export class UnknownOperandTypeError extends DisassemblerError {
    public constructor(operand: OperandValue, details?: Record<string, unknown>) {
        super(`Unknown operand type: ${operand.type}`, {
            type: operand.type,
            ...details,
        })
        this.name = "UnknownOperandTypeError"
    }
}
