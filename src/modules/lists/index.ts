import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType } from "@components/errors";
import { Logger } from "@components/logger";
import Fela from "@libs/fela";
import { node } from "@libs/validator";
import { cache, singleArgAssert, validate } from "../mixins";

export interface IList<T = IListItem> {
	[key: string]: T;
}

export interface IListItem {
	code: string;
	title: string;
	[key: string]: any;
}

class ListSource {
	[key: string]: (data?: any) => IList | Promise<IList> | Promise<IListItem[]> | any;

	@singleArgAssert("provider_code")
	@validate([node("provider_code").exists()])
	@cache({
		logger: Logger.info,
		key: `databundles-{{provider_code}}`,
	})
	public async dataBundles(payload: any) {
		const providers = (await this.dataProviders()) as object;
		if (!Object.keys(providers).includes(payload.provider_code.toUpperCase())) {
			throw new BadRequestError("Invalid provider code provided. Please check and try again").setData(payload);
		}
		const { data, ok } = await Fela.getDatabundles(payload.provider_code.toUpperCase());
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
		if (!Object.keys(providers).includes(payload.provider_code.toUpperCase())) {
			throw new BadRequestError("Invalid provider code provided. Please check and try again").setData(payload);
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
}

export const listSources = new ListSource();
