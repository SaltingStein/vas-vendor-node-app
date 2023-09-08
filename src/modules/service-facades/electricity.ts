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
		const provider = await import(path);
		if (provider["services"]["electricity"] && provider["services"]["electricity"].includes(productType.toUpperCase())) {
			provisionedVendor = provider.Electricity;
		}
	}
	return provisionedVendor;
};
