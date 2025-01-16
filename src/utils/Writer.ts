export class Writer {
    #indent = 0;
    #lines: string[] = [];

    indent = (handler: () => void) => {
        this.#indent++;
        try {
            handler();
        } finally {
            this.#indent--;
        }
    };

    #currentLine = '';

    write(src: string) {
        this.#currentLine += src;
    }

    newLine() {
        this.#lines.push(' '.repeat(this.#indent * 2) + this.#currentLine);
        this.#currentLine = '';
    }

    writeLine(src: string) {
        this.#lines.push(' '.repeat(this.#indent * 2) + this.#currentLine + src);
        this.#currentLine = '';
    }

    end() {
        if (this.#currentLine !== '') {
            this.newLine();
        }

        return this.#lines.join('\n');
    }
}
