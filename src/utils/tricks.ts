export const repeat = (length: number, callback: () => void): void => {
    for (let i = 0; i < length; i++) {
        callback()
    }
}
