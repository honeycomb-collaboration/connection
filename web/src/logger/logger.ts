enum Level {
    debug = 0,
    info = 1,
    error = 2,
}

export class Logger {
    public level: Level
    public readonly label: string

    constructor(label: string, level: Level = Level.debug) {
        this.level = level
        this.label = label
    }

    public setLevel(level: Level) {
        this.level = level
    }

    public debug(...args: unknown[]) {
        if (this.level > Level.debug) {
            return
        }
        console.debug(`[${this.label}]`, ...args)
    }

    public info(...args: unknown[]) {
        if (this.level > Level.info) {
            return
        }
        console.info(`[${this.label}]`, ...args)
    }

    public error(...args: unknown[]) {
        if (this.level > Level.error) {
            return
        }
        console.error(`[${this.label}]`, ...args)
    }
}
