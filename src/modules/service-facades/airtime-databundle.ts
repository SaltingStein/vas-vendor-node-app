import { AirtimeProvider, DataProvider } from "@components/interfaces";
import { AirtimeNetworks, DataNetworks } from "@components/enums";

export const vendors: {
	[T: string]: string;
} = {
	FELA: "fela",
};

export const dataBundleVendor = async (productType: DataNetworks): Promise<DataProvider> => {
	let provisionedVendor!: DataProvider;
	for (const vendor in vendors) {
		const path = `@libs/${vendors[vendor]}`;
		const provider = (await import(path)).default;
		if (provider.services["services"]["dataBundle"] && provider.services["services"]["dataBundle"].includes(productType)) {
			provisionedVendor = provider;
		}
	}
	return provisionedVendor;
};

export const airtimeVendor = async (productType: AirtimeNetworks): Promise<AirtimeProvider> => {
	let provisionedVendor!: AirtimeProvider;
	for (const vendor in vendors) {
		const path = `@libs/${vendors[vendor]}`;
		const provider = (await import(path)).default;
		if (provider.services["services"]["airtime"] && provider.services["services"]["airtime"].includes(productType)) {
			provisionedVendor = provider;
			break;
		}
	}
	return provisionedVendor;
};
