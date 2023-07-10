import Config from "@config";
import { Logger } from "@weaverkit/logger";
import http from "http";
import app from "./api";

app.set("port", Config.App.PORT);

const server = http.createServer(app);

(async () => {
	try {
		await new Promise<void>((resolve) => {
			server.listen(Config.App.PORT, () => {
				Logger.info(`Running on localhost:${Config.App.PORT}`);
				Logger.info(`Running Environment: ${Config.App.ENV}`);
				resolve();
			});
		});
	} catch (error) {
		Logger.error(error);
		process.exit(1);
	}
})();
