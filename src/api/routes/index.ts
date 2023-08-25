import { RouteCollection, RouteLoader } from "@weaverkit/express";
import { BearerAuth, authorize } from "../middlewares";
import * as Api from "@components/api";
import * as Validators from "@api/validators";
import {
	ListController,
	VendController,
	OfferingController,
	SourceController,
	InfoController,
	CashtokenBundleController,
	CallbackController,
} from "@controllers";
const { fromPath } = RouteLoader();

export const routes: RouteCollection = {
	docs: fromPath("@routes/docs"),
	list: Api.load({
		get: [["/:name", Validators.List.fetch, [], ListController.fetch]],
	}),
	info: Api.load({
		get: [["/:name", Validators.List.fetch, [], InfoController.fetch]],
	}),
	vend: Api.load({
		post: [["/", Validators.Vend.service, [], VendController.fulfill]],
	}),
	offering: Api.load({
		post: [["/", Validators.Offering, [], OfferingController.create]],
	}),
	cashtokenBundle: Api.load({
		post: [["/", Validators.CashtokenBundle.create, [], CashtokenBundleController.create]],
	}),
	source: Api.load({
		post: [["/", Validators.Source, [], SourceController.create]],
	}),
	callback: Api.load({
		post: [["/:name", [], [], null]],
	}),
};

export const RestAuth = BearerAuth({
	strategy: authorize,
	excludedPaths: {
		all: [/^\/docs(\/?)/],
		// get: [/^\/list(\/?)/, /^\/info(\/?)/],
		// get: [/^\/info(\/?)/],
		post: [/^\/offering(\/?)/, /^\/source(\/?)/, /^\/cashtokenBundle(\/?)/],
	},
});
