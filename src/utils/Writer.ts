import { trimIndent } from './text';
export class Writer {
    #indent = 0;
    #lines: string[] = [];

    get indent() {
        return ' '.repeat(this.#indent * 2);
    }

    inIndent = (handler: () => void) => {
        this.#indent++;
        handler();
        this.#indent--;
    };

    append(src: string = '') {
        this.#lines.push(this.indent + src);
    }

    write(src: string) {
        let lines = trimIndent(src).split('\n');
        for (let l of lines) {
            this.append(l);
        }
    }

    end() {
        return this.#lines.join('\n');
    }
}