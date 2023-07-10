import { RouteCollection, RouteLoader } from "@weaverkit/express";
import { BearerAuth } from "../middlewares";
import * as Api from "@components/api";
import * as Validators from "@api/validators";
import { ListController, VendController } from "@controllers";
const { fromPath } = RouteLoader();

export const routes: RouteCollection = {
	docs: fromPath("@routes/docs"),
	list: Api.load({
		get: [["/:name", Validators.List.fetch, [], ListController.fetch]],
	}),
	vend: Api.load({
		post: [["/", Validators.Vend.service, [], VendController.fulfill]],
	}),
};

export const RestAuth = BearerAuth({
	strategy: (token, ctx) => {
		return { authorized: true };
	},
	excludedPaths: {
		all: [/^\/docs(\/?)/],
		get: [/^\/list(\/?)/],
	},
});
