export class BaseWriter {
    private readonly lines: string[] = []
    private indentLevel: number = 0
    private currentLine: string = ""

    public indent(handler: () => void): void {
        this.indentLevel++
        try {
            handler()
        } finally {
            this.indentLevel--
        }
    }

    public write(src: string): void {
        this.currentLine += src
    }

    public newLine(): void {
        this.lines.push(" ".repeat(this.indentLevel * 2) + this.currentLine)
        this.currentLine = ""
    }

    public writeLine(src: string): void {
        this.lines.push(" ".repeat(this.indentLevel * 2) + this.currentLine + src)
        this.currentLine = ""
    }

    public trim(): void {
        this.currentLine = this.currentLine.trim()
    }

    public end(): string {
        if (this.currentLine !== "") {
            this.newLine()
        }

        return this.lines.join("\n")
    }

    public lineLength(): number {
        return this.currentLine.length + this.indentLevel * 2
    }
}
