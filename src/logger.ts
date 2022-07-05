enum Level {
    debug = 0,
    info = 1,
    error = 2,
}

export class DevelopLogger {
    public level: Level

    constructor(level: Level = Level.debug) {
        this.level = level
    }

    public setLevel(level: Level) {
        this.level = level
    }

    public debug(label: string, ...args: unknown[]) {
        if (this.level > Level.debug) {
            return
        }
        console.debug(...args)
    }

    public info(label: string, ...args: unknown[]) {
        if (this.level > Level.info) {
            return
        }
        console.info(...args)
    }

    public error(label: string, ...args: unknown[]) {
        if (this.level > Level.error) {
            return
        }
        console.error(...args)
    }
}
