import { NotFoundError } from "@components/errors";
import { electricity } from "../modules/info";
import { App } from "@config";

interface IQuery {
	name: string;
	filters?: any;
}

export const fetch = async ({ name, ...filters }: IQuery) => {
	if (!electricity[name as keyof typeof electricity]) {
		App.ErrorHandler.handle(new NotFoundError(`Info ${name} does not exist`));
		throw new NotFoundError(`Resource not found`);
	}
	return electricity[name as keyof typeof electricity](filters);
};
