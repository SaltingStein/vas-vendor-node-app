import { ElectricityProvider, Services } from "@components/interfaces";

export const vendors: {
	[T: string]: string;
} = {
	FELA: "fela",
	PHEDC: "phedc",
};

export const electrcityVendor = async (productType: string): Promise<ElectricityProvider | null> => {
	let provisionedVendor: (ElectricityProvider & Services) | null = null;
	for (const vendor in vendors) {
		const path = `@libs/${vendors[vendor]}`;
		const provider = (await import(path)).default;
		if (
			provider.services["services"]["electricity"] &&
			provider.services["services"]["electricity"].includes(productType.toUpperCase())
		) {
			provisionedVendor = provider;
		}
	}
	return provisionedVendor;
};
