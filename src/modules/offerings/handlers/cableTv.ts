import { Artifact } from "@components/artifact";
import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType } from "@components/errors";
import { CableTvProvider } from "@components/interfaces";
import { listSources } from "@modules/lists";
import { CableTv as FelaCableTv } from "@libs/fela";
import { getUniqueReference } from "@libs/utils";
import { node, PaidOfferingHandler } from "@modules/offerings";
import { TvFacade } from "@modules/service-facades";
import moment from "moment-timezone";
moment.tz.setDefault("Africa/Lagos");

class CableTv extends PaidOfferingHandler {
	private vendor!: any;

	public async value() {
		const result = (await this.vendor.default.vend({
			smartcardNo: this.params.providerId,
			transactionRef: this.params.transactionReference,
			bouquetCode: this.params.providerCode,
			merchantId: this.source.sourceId,
			providerCode: this.params.productType,
		})) as any;
		const { data, ok } = result;
		data.transactionReference = this.source.sessionId;
		if (ok) {
			return new Artifact(data, "Fulfillment Successful");
		}
		switch (data.type) {
			case ErrorType.SERVICEUNAVAILABLE:
				throw new ServiceUnavailableError(data.message).setData(data);
			case ErrorType.BADREQUEST:
				throw new BadRequestError(data.message).setData(data);
			default:
				throw new ServerError().setData(data);
		}
	}

	public async getAmount() {
		return await this.init().then(() => this.params.amount);
	}

	public getDescription() {
		return `${this.params.productType} cable subscription for ${this.params.providerId}`;
	}

	public async beforePayment() {
		this.data.params.transactionReference = `${getUniqueReference()}`;
		const { data } = (await FelaCableTv.default.fetchBouquets(this.data.params.productType)) as any;
		this.data.params.service = data[this.data.params.providerCode];
		const providerList = (await listSources.cableProviders()) as any;
		this.data.params.providerName = providerList[this.data.params.productType]["title"].toUpperCase();
	}

	public async validator() {
		return [
			node("providerCode")
				.exists()
				.customValidator(async (value) => {
					const { productType } = this.params;
					const bouquets = (await listSources.cabletvBouquets({ provider_code: productType })) as {
						[x: string]: {
							code: string;
							title: string;
							price: number;
							slug: string;
						};
					};
					if (bouquets[value]) {
						return true;
					} else {
						return false;
					}
				})
				.withMessage(`Unable to process request.Please check bouquet(${this.params.providerCode}) and try again`),
			node("productType")
				.exists()
				.isIn(Object.keys((await listSources.cableProviders()) as object))
				.withMessage(`productType should be any of ${Object.keys((await listSources.cableProviders()) as object)}`)
				.customValidator(async (value) => {
					const providers = (await listSources.cableProviders()) as {
						[T: string]: {
							code: string;
							title: string;
							providerId: string;
						};
					};
					this.params.productType = providers[value].providerId;
					return true;
				}),
			node("providerId")
				.exists()
				.customValidator(async (value) => {
					const { productType, providerCode } = this.params;
					const { ok } = await FelaCableTv.default.verifySmartCardNo({
						cardNo: value,
						providerCode: productType,
						bouquetCode: providerCode,
					});
					let response: boolean;
					if (!ok) {
						response = false;
					} else {
						response = true;
					}
					return response;
				})
				.withMessage(`Error verifying smart card number(${this.params.providerId}).Please check smart card number and try again`),
		];
	}

	public async init() {
		const init = await super.init();
		this.vendor = await TvFacade.cableTvVendor(this.params.productType);
		return init;
	}
}

export = CableTv;
