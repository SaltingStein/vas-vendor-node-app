import { Artifact } from "@components/artifact";
import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType } from "@components/errors";
import { CableTvProvider } from "@components/interfaces";
import { listSources } from "@modules/lists";
import Fela from "@libs/fela";
import { getUniqueReference } from "@libs/utils";
import { node, PaidOfferingHandler } from "@modules/offerings";
import { TvFacade } from "@modules/service-facades";
import moment from "moment-timezone";
moment.tz.setDefault("Africa/Lagos");

class CableTv extends PaidOfferingHandler {
	private vendor!: CableTvProvider;

	public async value() {
		const result = (await this.vendor.vendCableTv({
			smartcardNo: this.params.providerId,
			transactionRef: this.params.transactionReference,
			bouquetCode: this.params.providerCode,
			merchantId: this.source.sourceId,
			providerCode: this.params.productType,
		})) as any;
		const { data, ok } = result;
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
		return `${this.params.providerName} | ${this.params.service.title || ""} cable subscription for ${this.params.providerId}`;
	}

	public async beforePayment() {
		this.data.params.transactionReference = `${getUniqueReference()}`;
		const { data } = (await Fela.fetchBouquets(this.data.params.productType)) as any;
		this.data.params.service = data[this.data.params.providerCode];
		const providerList = (await listSources.cableProviders()) as any;
		this.data.params.providerName = providerList[this.data.params.productType]["title"].toUpperCase();
	}

	public async validator() {
		return [
			node("productType")
				.exists()
				.isIn(Object.keys((await listSources.cableProviders()) as object))
				.withMessage(`productType should be any of ${Object.keys((await listSources.cableProviders()) as object)}`),
			node("providerCode")
				.exists()
				.customValidator(async (value) => {
					const { productType } = this.params;
					const { ok, data } = (await Fela.fetchBouquets(productType)) as any;
					let response: boolean;
					if (!ok) {
						response = false;
					} else {
						if (Object.keys(data).includes(value) && data[value]) {
							this.params.amount = data[value].price;
							response = true;
						} else {
							response = false;
						}
					}
					return response;
				})
				.withMessage(`Unable to process request.Please check bouquet(${this.params.providerCode}) and try again`),
			node("providerId")
				.exists()
				.customValidator(async (value) => {
					const { productType, providerCode } = this.params;
					const { ok } = await Fela.verifySmartCardNo({
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
