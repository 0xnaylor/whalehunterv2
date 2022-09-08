import { createLogger, format, transports } from 'winston';
const { combine, timestamp, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
});

export const logger = createLogger({
    level: 'info',
    format: combine(
        label({ label: 'whale_hunter_v2' }),
        timestamp(),
        myFormat
    ),
    // defaultMeta: { service: 'check_unicorn_balance' },
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new transports.File({ filename: 'logs/whale_hunter_v2.log', level: 'error' }),
        new transports.File({ filename: 'logs/whale_hunter_v2.log' }),
    ],
});