import { Artifact } from "@components/artifact";
import { createBundle } from "../modules/cashtokenBundles";
import { BundleSchema } from "@models/cashtokenBundles";
import * as Interface from "@libs/WPCore/interfaces";

export const create = async (data: BundleSchema) => {
	return new Artifact(await createBundle(data), "Bundle created successfully");
};
