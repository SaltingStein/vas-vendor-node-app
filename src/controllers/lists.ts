import { Artifact } from "@components/artifact";
import { NotFoundError } from "@components/errors";
import { listSources } from "../modules/lists";
import { App } from "@config";
import * as Interface from "@libs/WPCore/interfaces";

interface IQuery {
	name: string;
	filters?: any;
}

export const fetch = async ({ name, ...filters }: IQuery, user: Interface.Data) => {
	if (!listSources[name]) {
		App.ErrorHandler.handle(new NotFoundError(`List ${name} does not exist`));
		throw new NotFoundError(`Resource not found`);
	}
	return new Artifact(await listSources[name](filters, user), "List successfully fetched");
};
