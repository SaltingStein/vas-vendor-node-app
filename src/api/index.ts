import { WeaverExpressApp, WeaverExpressAppEvents } from "@weaverkit/express";
import { RestAuth, routes } from "@api/routes";
import { LogStream, Logger, createContextId } from "@weaverkit/logger";
import express, { Application, NextFunction, Request, Response } from "express";
import morgan from "morgan";
import path from "path";
import Config from "@config";
import MySQLConnection from "@connections/mysql";

const WeaverApp = new WeaverExpressApp({
	routes,
	errorHandler: Config.App.ErrorHandler,
});

WeaverApp.on(WeaverExpressAppEvents.PREINIT, (app: Application) => {
	Logger.info("App init called");
	app.use((req: Request, res: Response, next: NextFunction) => {
		createContextId((error: Error | null, contextId: string | false) => {
			if (contextId) {
				res.set("X-Context-Id", contextId);
			}
			next();
		});
	});
	const format =
		':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms :total-time ms ":referrer" ":user-agent"';
	app.use(
		morgan(format, {
			stream: LogStream,
			// skip: req => {
			// 	return req.originalUrl.startsWith("/somepath");
			// },
		}),
	);
	app.use("/assets", express.static(path.join(__dirname, "./../../assets")));
	app.use(RestAuth);
});

WeaverApp.once(WeaverExpressAppEvents.ROUTES_DID_BIND, async (app: Application) => {
	Logger.info("App routes have been mounted");
});

WeaverApp.init();

export default WeaverApp.app;
