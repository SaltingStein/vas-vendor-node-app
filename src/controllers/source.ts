import { Artifact } from "@components/artifact";
import { createSource } from "@modules/source";

interface IBody {
	source: string;
}

export const create = async ({ source: name }: IBody) => {
	return new Artifact(await createSource(name), "Source created successfully");
};
