import { CashtokenBundles, BundleSchema } from "@models/cashtokenBundles";

export const createBundle = async (payload: BundleSchema) => {
	const bundle = await CashtokenBundles.createBundle(payload);
	return bundle;
};
