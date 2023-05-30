import { RouteCollection, RouteLoader } from "@weaverkit/express";
import { BearerAuth } from "../middlewares";
import { App as AppConfig } from "@config";

const { fromPath } = RouteLoader();

export const routes: RouteCollection = {
	docs: fromPath("@routes/docs"),
};

export const RestAuth = BearerAuth({
	strategy: (token, ctx) => {
		return { authorized: true };
	},
	excludedPaths: {
		all: [/^\/docs(\/?)/],
		get: [],
	},
});
