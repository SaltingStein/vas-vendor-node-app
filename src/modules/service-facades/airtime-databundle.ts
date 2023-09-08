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
		const provider = await import(path);
		if (provider["services"]["dataBundle"] && provider["services"]["dataBundle"].includes(productType)) {
			provisionedVendor = provider.DataBundle;
		}
	}
	return provisionedVendor;
};

export const airtimeVendor = async (productType: AirtimeNetworks): Promise<AirtimeProvider> => {
	let provisionedVendor!: AirtimeProvider;
	for (const vendor in vendors) {
		const path = `@libs/${vendors[vendor]}`;
		const provider = await import(path);
		if (provider["services"]["airtime"] && provider["services"]["airtime"].includes(productType)) {
			provisionedVendor = provider.Airtime;
			break;
		}
	}
	return provisionedVendor;
};
