import { AirtimeProvider, DataProvider } from "@components/interfaces";
import { AirtimeNetworks, DataNetworks } from "@components/enums";

export enum Vendors {
	FELA = "fela",
}

export const dataBundleVendor = async (productType: DataNetworks): Promise<DataProvider> => {
	let provisionedVendor!: DataProvider;
	for (const vendor in Vendors) {
		const path = `@libs/${vendor}`;
		const provider = (await import(path))[vendor];
		if (provider.services["dataBundle"] && provider.services["services"]["dataBundle"].includes(productType.toLowerCase())) {
			provisionedVendor = provider;
		}
	}
	return provisionedVendor;
};

export const airtimeVendor = async (productType: AirtimeNetworks): Promise<AirtimeProvider> => {
	let provisionedVendor!: AirtimeProvider;
	for (const vendor in Vendors) {
		const path = `@libs/${vendor}`;
		const provider = (await import(path)).default;
		if (provider.services["services"]["airtime"] && provider.services["services"]["airtime"].includes(productType)) {
			provisionedVendor = provider;
			break;
		}
	}
	return provisionedVendor;
};
