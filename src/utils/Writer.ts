import { trimIndent } from './text';
export class Writer {
    #indent = 0;
    #lines: string[] = [];

    get indent() {
        return this.#indent;
    }

    inIndent = (handler: () => void) => {
        this.#indent++;
        try {
            handler();
        } finally {
            this.#indent--;
        }
    };

    append(src: string = '') {
        this.#lines.push(src);
    }

    // appendNoIndent(src: string = '') {
    //     this.#lines.push(src);
    // }

    // append(src: string = '') {
    //     this.appendNoIndent(' '.repeat(this.#indent * 2) + src);
    // }

    // write(src: string) {
    //     let lines = trimIndent(src).split('\n');
    //     for (let l of lines) {
    //         this.append(l);
    //     }
    // }

    end() {
        return this.#lines.join('\n');
    }
}