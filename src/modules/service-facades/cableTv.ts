import { CableTvProvider } from "@components/interfaces";
import { CableNetworks } from "@components/enums";

export enum Vendors {
	FELA = "fela",
}

/**
 * @todo Pending implementation for multiple cableTv providers depending on product type
 */
export const cableTvVendor = async (productType: CableNetworks): Promise<CableTvProvider> => {
	let provisionedVendor!: CableTvProvider;
	for (const vendor in Vendors) {
		const path = `@libs/${vendor}`;
		const provider = (await import(path)).default;
		provisionedVendor = provider;
		// if (provider.services["cableTv"] && provider.services["cableTv"].includes(productType.toLowerCase())) {
		// }
	}
	return provisionedVendor;
};
