import path from "path";
import winston from "winston";
import { environment } from "../config/environment";

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info: winston.Logform.TransformableInfo) => {
    const metadata: Record<string, any> = { ...info };

    delete metadata.timestamp;
    delete metadata.level;
    delete metadata.message;

    const metadataStr = Object.keys(metadata).length
      ? `\n${JSON.stringify(metadata, null, 2)}`
      : "";

    return `${info.timestamp} ${info.level}: ${info.message}${metadataStr}`;
  })
);

const logsDir = path.join(process.cwd(), "logs");

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: path.join(logsDir, "error.log"),
    level: "error",
  }),
  new winston.transports.File({
    filename: path.join(logsDir, "all.log"),
  }),
];

const logger = winston.createLogger({
  level: environment.logLevel,
  levels,
  format,
  transports,
});

export default logger;
