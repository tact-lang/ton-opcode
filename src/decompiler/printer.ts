export type Printer = (src: string | { op: string, hash: string, offset: number, length: number }, indent: number) => string;

export function createTextPrinter(indentWidth: number): Printer {
    return (src, indent) => {
        if (typeof src === 'string') {
            return ' '.repeat(indentWidth * indent) + src;
        } else {
            return ' '.repeat(indentWidth * indent) + src.op;
        }
    };
}