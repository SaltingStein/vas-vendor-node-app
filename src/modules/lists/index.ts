import { App } from "@config";
import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType } from "@components/errors";
import { Logger } from "@components/logger";
import Fela from "@libs/fela";
import { node } from "@libs/validator";
import { formatListResponse } from "@libs/utils";
import { cache, singleArgAssert, validate } from "../mixins";
import { DataBundles } from "@models/dataBundles";
import { CabletvBouquets } from "@models/cabletvBouquets";
import { AirtimeProviders } from "@models/airtimeProviders";
import { CabletvProviders } from "@models/cabletvProviders";
import { ElectricityProvider } from "@models/electricityProviders";
import { DataBundleProviders } from "@models/dataBundleProviders";
import { Offering } from "@models/offering";
import { CashtokenBundles, BundleSchema } from "@models/cashtokenBundles";
import WPCore from "@libs/WPCore";
export interface IList<T = IListItem> {
	[key: string]: T;
}

export interface IListItem {
	code: string;
	title: string;
	[key: string]: any;
}

class ListSource {
	[key: string]: (data?: any, user?: any) => IList | Promise<IList> | Promise<IListItem[]> | any;

	@singleArgAssert("provider_code")
	@validate([node("provider_code").exists()])
	@cache({
		logger: Logger.info,
		key: `databundles-{{provider_code}}`,
	})
	public async dataBundles(payload: any) {
		const providers = (await this.dataProviders()) as object;
		if (!Object.keys(providers).includes(payload.provider_code)) {
			throw new BadRequestError("Invalid provider code provided. Please check and try again").setData(payload);
		}
		if (!App.PROD) {
			const response = (await DataBundles.findOne({ providerId: payload.provider_code }, { bundles: 1 })) as unknown as {
				bundles: {
					code: string;
					title: string;
					price: number;
					providerId: string;
				}[];
			};
			if (response) {
				return formatListResponse(response.bundles);
			} else {
				throw new BadRequestError("Invalid provider code provided. Please check and try again").setData(payload);
			}
		}
		const { data, ok } = await Fela.getDatabundles(payload.provider_code);
		if (ok) {
			return data;
		} else if ("message" in data) {
			switch (data.type) {
				case ErrorType.SERVICEUNAVAILABLE:
					throw new ServiceUnavailableError(data.message).setData(payload);
				case ErrorType.BADREQUEST:
					throw new BadRequestError(data.message).setData(payload);
				default:
					throw new ServerError().setData(payload);
			}
		}
	}

	@cache({
		logger: Logger.info,
		key: `airtimeProviders`,
	})
	public async airtimeProviders() {
		if (!App.PROD) {
			const response = (await AirtimeProviders.find({}, { _id: 0 })) as unknown as object[];
			if (response) {
				return formatListResponse(response);
			} else {
				throw new BadRequestError(`Unable to retrieve airtime providers. Please try again`);
			}
		}
		const { data, ok } = await Fela.fetchAirtimeProviders();
		if (ok) {
			return data;
		} else if ("message" in data) {
			throw data.message;
		}
	}
	@cache({
		logger: Logger.info,
		key: `databundleProviders`,
	})
	public async dataProviders() {
		if (!App.PROD) {
			const response = (await DataBundleProviders.find({}, { _id: 0 })) as unknown as object[];
			if (response) {
				return formatListResponse(response);
			} else {
				throw new BadRequestError(`Unable to retrieve databundle providers. Please try again`);
			}
		}
		const { data, ok } = await Fela.fetchDatabundleProviders();
		if (ok) {
			return data;
		} else if ("message" in data) {
			throw data.message;
		}
	}

	@singleArgAssert("provider_code")
	@validate([node("provider_code").exists()])
	@cache({
		logger: Logger.info,
		key: `cabletvBouquets-{{provider_code}}`,
	})
	public async cabletvBouquets(payload: any) {
		const providers = (await this.cableProviders()) as object;
		if (!Object.keys(providers).includes(payload.provider_code)) {
			throw new BadRequestError("Invalid provider code provided. Please check and try again").setData(payload);
		}
		if (!App.PROD) {
			const response = (await CabletvBouquets.findOne({ providerId: payload.provider_code }, { bouquets: 1 })) as unknown as {
				bouquets: {
					[x: string]: {
						code: string;
						title: string;
						price: number;
						slug: string;
					};
				};
			};
			if (response) {
				return response.bouquets;
			} else {
				throw new BadRequestError("Invalid provider code provided. Please check and try again").setData(payload);
			}
		}
		const { data, ok } = await Fela.fetchBouquets(payload.provider_code);
		if (ok) {
			return data;
		} else if ("message" in data) {
			switch (data.type) {
				case ErrorType.SERVICEUNAVAILABLE:
					throw new ServiceUnavailableError(data.message).setData(payload);
				case ErrorType.BADREQUEST:
					throw new BadRequestError(data.message).setData(payload);
				default:
					throw new ServerError().setData(payload);
			}
		}
	}

	@cache({
		logger: Logger.info,
		key: `cabletvProviders`,
	})
	public async cableProviders() {
		if (!App.PROD) {
			const response = (await CabletvProviders.find({}, { _id: 0 })) as unknown as object[];
			if (response) {
				return formatListResponse(response);
			} else {
				throw new BadRequestError(`Unable to retrieve cabletv providers. Please try again`);
			}
		}
		const { data, ok } = await Fela.fetchCabletvProviders();
		if (ok) {
			return data;
		} else if ("message" in data) {
			switch (data.type) {
				case ErrorType.SERVICEUNAVAILABLE:
					throw new ServiceUnavailableError(data.message);
				case ErrorType.BADREQUEST:
					throw new BadRequestError(data.message);
				default:
					throw new ServerError();
			}
		}
	}

	@cache({
		logger: Logger.info,
		key: `electricityProviders`,
	})
	public async electricityProviders() {
		if (!App.PROD) {
			const response = (await ElectricityProvider.find({}, { _id: 0 })) as unknown as object[];
			if (response) {
				return formatListResponse(response);
			} else {
				throw new BadRequestError(`Unable to retrieve electricity providers. Please try again`);
			}
		}
		const { data, ok } = await Fela.fetchElectricityProviders();
		if (ok) {
			return data;
		} else if ("message" in data) {
			switch (data.type) {
				case ErrorType.SERVICEUNAVAILABLE:
					throw new ServiceUnavailableError(data.message);
				case ErrorType.BADREQUEST:
					throw new BadRequestError(data.message);
				default:
					throw new ServerError();
			}
		}
	}

	@cache({
		logger: Logger.info,
		key: `offerings`,
	})
	public async offerings() {
		const offerings = await Offering.find({}, { name: 1, _id: 1 });

		if (offerings) {
			const formatOffering: string[] = [];
			for (const offering of offerings) {
				formatOffering.push(offering.name);
			}
			return formatOffering;
		}
		throw new ServiceUnavailableError("Unable to retrieve offering. Please try again");
	}

	@cache({
		logger: Logger.info,
		key: `cahtokenBundleProduct-{{product}}`,
	})
	public async cashtokenBundleProducts(payload: any) {
		const bundles = await CashtokenBundles.fetchBundles({ product: payload.product });
		if (Object.keys(bundles).length < 1) {
			throw new BadRequestError("Invalid product provided");
		}
		return bundles;
	}

	@cache({
		logger: Logger.info,
		key: `cahtokenBundleProvider-{{provider_code}}`,
	})
	public async cashtokenBundleProviders(payload: any, user: any) {
		const bundle = await CashtokenBundles.fetchBundles({ code: payload.provider_code });
		if (Object.keys(bundle).length < 1) {
			throw new BadRequestError("Invalid provider code provided");
		}
		const priceListings = await WPCore.getBundlePriceListing(user.token);
		if (!priceListings.ok) {
			throw new ServerError(priceListings.data.message);
		}
		let priceListing: any = {};
		const data: any = priceListings.data;
		for (const element in data) {
			if (element.toLocaleLowerCase() === bundle[Object.keys(bundle)[0] as unknown as number].product.toLocaleLowerCase()) {
				priceListing = data[element];
				for (const price in priceListing) {
					priceListing[price] = Object.assign(priceListing[price], { price });
				}
			}
		}
		if (Object.keys(priceListing).length < 1) {
			throw new ServerError(priceListings.data.message);
		}
		return priceListing;
	}
}

export const listSources = new ListSource();
