import { Artifact } from "@components/artifact";
// import { NotFoundError } from "@components/errors";
import { createOffering } from "../modules/offerings";
// import { App } from "@config";

interface IBody {
	offering: string;
}

export const create = async ({ offering: name }: IBody) => {
	return new Artifact(await createOffering(name), "Offering created successfully");
};
