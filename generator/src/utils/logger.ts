import * as winston from "winston"; // Logging

// Setup winston logger with timestamp
export const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        // Print to console
        new winston.transports.Console(),
        // Output to generator logfile
        new winston.transports.File({ filename: "generator.log" }),
    ],
});