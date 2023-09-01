import { NotFoundError } from "@components/errors";
import { infoSources } from "@modules/info";
import { App } from "@config";

interface IQuery {
	name: string;
	filters?: any;
}

export const fetch = async ({ name, ...filters }: IQuery) => {
	if (!infoSources[name as keyof typeof infoSources]) {
		App.ErrorHandler.handle(new NotFoundError(`Info ${name} does not exist`));
		throw new NotFoundError(`Resource not found`);
	}
	const result = await infoSources[name as keyof typeof infoSources](filters);
	return result;
};
