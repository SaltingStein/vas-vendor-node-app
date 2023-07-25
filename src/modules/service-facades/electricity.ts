import { ElectricityProvider, Services } from "@components/interfaces";

export enum Vendors {
	FELA = "fela",
	PHEDC = "phedc",
}

export const electrcityVendor = async (productType: string): Promise<ElectricityProvider | null> => {
	let provisionedVendor: (ElectricityProvider & Services) | null = null;
	for (const vendor in Vendors) {
		const path = `@libs/${vendor}`;
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
