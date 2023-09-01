import { Artifact } from "@components/artifact";
import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType } from "@components/errors";
import { DataProvider } from "@components/interfaces";
import { DataNetworks } from "@components/enums";
import Fela from "@libs/fela";
import { sanitizePhoneNumber, getUniqueReference } from "@libs/utils";
import { node, PaidOfferingHandler } from "@modules/offerings";
import { AirtimeDataBundleFacade } from "@modules/service-facades";
import moment from "moment-timezone";
moment.tz.setDefault("Africa/Lagos");

class DataBundle extends PaidOfferingHandler {
	private vendor!: DataProvider;

	public async value() {
		const result = (await this.vendor.vendDatabundle({
			recipient: this.params.providerId,
			transactionRef: this.params.transactionReference,
			network: this.params.productType,
			merchantId: this.source.sourceId,
			bundleCode: this.params.providerCode,
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
		return `N${this.params.amount} ${this.params.productType} Data for ${this.params.providerId}`;
	}

	public async beforePayment() {
		this.data.params.transactionReference = `${getUniqueReference()}`;
	}

	public async validator() {
		return [
			node("productType")
				.exists()
				.isIn(Object.values(DataNetworks))
				.withMessage(`ProductType should be any of ${Object.values(DataNetworks)}`),
			node("providerCode")
				.exists()
				.customValidator(async (value) => {
					const { productType } = this.params;
					const { ok, data } = (await Fela.getDatabundles(productType)) as any;
					let response: boolean;
					if (!ok) {
						response = false;
					} else {
						if (Object.keys(data.dataBundles).includes(value)) {
							this.params.amount = data["dataBundles"][value].price;
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
				.customSanitizer((value) => {
					return sanitizePhoneNumber(value);
				}),
		];
	}

	public async init() {
		const init = await super.init();
		this.vendor = await AirtimeDataBundleFacade.dataBundleVendor(this.params.productType);
		return init;
	}
}

export = DataBundle;
