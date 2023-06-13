import Config from "@config";
import { getUniqueReference } from "@libs/utils";
import { createNamespace, getNamespace } from "cls-hooked";
import path from "path";
import winston from "winston";
import LogRotator from "winston-daily-rotate-file";

const NAMESPACE = "log";
const logNamespace = createNamespace(NAMESPACE);

const getLogNamespace = () => {
	return getNamespace(NAMESPACE);
};

const { createLogger, format } = winston;

const logExtras = format((info) => {
	info.level = info.level.toLocaleUpperCase();
	const namespace = getNamespace(NAMESPACE);
	if (namespace) {
		const context = namespace.get("context");
		if (context) {
			info.context = context;
		}
	}
	return info;
});

const requestTracer = () => {
	return (req: any, res: any, next: any) => {
		if (logNamespace) {
			const context = getUniqueReference();
			res.set("X-Context-Id", context);
			logNamespace.run(() => {
				logNamespace.set("context", context);
				next();
			});
		} else {
			next();
		}
	};
};

const transports: winston.transport[] = [
	new winston.transports.Console({
		level: "debug",
		handleExceptions: true,
		format: format.combine(format.errors({ stack: true }), logExtras(), format.colorize(), format.simple()),
		silent: false,
	}),
];
if (Config.App.LOG_TO_FILE) {
	transports.push(
		new LogRotator({
			level: "debug",
			handleExceptions: true,
			format: format.combine(format.errors({ stack: true }), format.timestamp(), logExtras(), format.simple()),
			silent: false,
			filename: path.resolve(Config.App.LOG_DIR, "%DATE%.log"),
		}),
	);
}
const Logger = createLogger({ transports });

// export default Logger;

const LogStream = {
	write: (message: any) => {
		Logger.info(message);
	},
};

export { LogStream, NAMESPACE, Logger, requestTracer, getLogNamespace };
