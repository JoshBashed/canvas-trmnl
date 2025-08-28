export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const LOG_LEVEL_MAP = {
    debug: 0,
    error: 3,
    fatal: 4,
    info: 1,
    warn: 2,
} as const satisfies Record<LogLevel, number>;

export class Logger {
    private static mainInstance: Logger = new Logger();
    private topInstance: Logger | undefined;
    private module: string | undefined;
    private logLevel: LogLevel =
        process.env.NODE_ENV === 'production' ? 'info' : 'debug';

    private constructor() {
        // Private constructor to prevent instantiation
    }

    public static getInstance(): Logger {
        return Logger.mainInstance;
    }

    public createChild(module: string): Logger {
        const child = new Logger();
        child.topInstance = this.topInstance ?? this;
        child.module = this.module ? `${this.module}.${module}` : module;
        return child;
    }

    public setLogLevel(level: LogLevel): void {
        if (this.topInstance) this.topInstance.setLogLevel(level);
        else this.logLevel = level;
    }

    private log(
        level: LogLevel,
        message: string,
        module: string | undefined = this.module,
        ...args: (string | number | object)[]
    ): void {
        if (this.topInstance) {
            this.topInstance.log(level, message, module, ...args);
            return;
        }
        if (LOG_LEVEL_MAP[level] < LOG_LEVEL_MAP[this.logLevel]) return;
        console.log(
            `%s [%s] ${message}`,
            module ?? 'global',
            level.toUpperCase(),
            ...args,
        );
    }

    public debug(message: string, ...args: (string | number | object)[]): void {
        this.log('debug', message, undefined, ...args);
    }

    public info(message: string, ...args: (string | number | object)[]): void {
        this.log('info', message, undefined, ...args);
    }

    public warn(message: string, ...args: (string | number | object)[]): void {
        this.log('warn', message, undefined, ...args);
    }

    public error(message: string, ...args: (string | number | object)[]): void {
        this.log('error', message, undefined, ...args);
    }

    public fatal(message: string, ...args: (string | number | object)[]): void {
        this.log('fatal', message, undefined, ...args);
    }
}

export const createLogger = (name: string) => {
    return Logger.getInstance().createChild(name);
};
