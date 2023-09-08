import { App } from "@config";
import { Artifact } from "@components/artifact";
import { NotFoundError } from "@components/errors";
import { callbackSources, Actions, Params } from "../modules/callbacks";

interface IQuery {
	name: string;
	filters: Params;
}

export const callback = async ({ name, filters }: IQuery) => {
	console.log("FILTER IS HERE O", filters);
	if (!callbackSources[name as keyof typeof callbackSources]) {
		App.ErrorHandler.handle(new NotFoundError(`No Callback handler for ${name}`));
		throw new NotFoundError(`Resource not found`);
	}
	return new Artifact(await callbackSources[name as keyof typeof callbackSources](filters), "Callback recieved successfully");
};
