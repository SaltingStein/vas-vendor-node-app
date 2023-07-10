import { Artifact } from "@components/artifact";
import { NotFoundError } from "@components/errors";
import { listSources } from "../modules/lists";
import { App } from "@config";

interface IQuery {
	name: string;
	filters?: any;
}

export const fetch = async ({ name, ...filters }: IQuery) => {
	if (!listSources[name]) {
		App.ErrorHandler.handle(new NotFoundError(`List ${name} does not exist`));
		throw new NotFoundError(`List ${name} does not exist`);
	}
	return new Artifact(await listSources[name](filters), "List successfully fetched");
};
