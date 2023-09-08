import { config as loadOverrides } from "dotenv";
import fs from "fs";
import path from "path";
import { addFileLogging, Logger } from "@weaverkit/logger";
import { ErrorHandler } from "@weaverkit/errors";

const ENV = process.env.NODE_ENV || "development";
const PROD = ENV === "production";
const OVERRIDE_PATH = path.resolve(__dirname, `./../../.${ENV}.env`);
if (fs.existsSync(OVERRIDE_PATH)) {
	loadOverrides({
		path: OVERRIDE_PATH,
		debug: true,
	});
}
function getEnv<T = string>(key: string, onNotExist: any | null = null) {
	return (process.env[key] || onNotExist) as T;
}

const LOG_DIR = path.resolve(process.env.LOG_DIR || __dirname + "/../../logs");
const getLogPath = () => {
	return path.resolve(LOG_DIR, path.parse(process.env.pm_exec_path || process.argv[1]).name);
};
const Config = Object.freeze({
	App: {
		NAME: "Vas Vendor",
		ENV,
		PORT: getEnv<number>("PORT", 3200),
		LOG_DIR: getLogPath(),
		PROD,
		DEFAULT_CACHE_PERIOD: 3600,
		ErrorHandler: new ErrorHandler(),
		contactEmail: getEnv<string>("CONTACT_EMAIL"),
		contactPhone: getEnv<string>("CONTACT_PHONE"),
		LOG_TO_FILE: !!Number(getEnv<string>("ADD_FILE_LOGGING", "0")),
		BASE_URL: getEnv<string>("BASE_URL", "http://127.0.0.1:4600/"),
		JWT_SECRET: getEnv<string>("JWT_SECRET"),
		ADMIN_MISDN: getEnv<string>("ADMIN_MISDN", "2348137107881"),
		ADMIN_TOKEN: getEnv<string>("ADMIN_TOKEN"),
	},
	Fela: {
		sourceName: getEnv<string>("FELA_SOURCE"),
		baseUrl: getEnv<string>("FELA_BASE_URL"),
		authToken: getEnv<string>("FELA_AUTH_TOKEN"),
	},
	WP_CORE: {
		url: getEnv<string>("WP_CORE_URL"),
	},
	Phedc: {
		baseUrl: getEnv<string>("PHEDC_BASE_URL"),
		userName: getEnv<string>("PHEDC_USER_NAME"),
		apiKey: getEnv<string>("PHEDC_API_KEY"),
	},
	Redis: {
		host: getEnv<string>("REDIS_HOST", "127.0.0.1"),
		port: Number(getEnv<string>("REDIS_PORT", 6379)),
		password: getEnv<string>("REDIS_PASSWORD", ""),
		user: getEnv<string>("REDIS_USER"),
		db: getEnv<string>("REDIS_DB", 2),
	},
	MySQL: {
		database: getEnv<string>("MYSQL_DATABASE"),
		username: getEnv<string>("MYSQL_USERNAME"),
		password: getEnv<string>("MYSQL_PASSWORD"),
		host: getEnv<string>("MYSQL_HOST"),
		port: Number(getEnv<string>("MYSQL_PORT")),
		systemUser: getEnv<string>("SYSTEM_USER", 1),
		dialet: "mysql",
	},
	Db: {
		MONGO_URI: getEnv<string>("MONGO_URI", "mongodb://localhost:27017/vasvending"),
	},
});

addFileLogging(Config.App.LOG_DIR);

Config.App.ErrorHandler.on("handle", (error: Error) => {
	Logger.error("Bubbled Error: ", error);
});

export = Config;
