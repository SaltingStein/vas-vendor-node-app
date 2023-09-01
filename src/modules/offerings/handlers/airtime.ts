import { Artifact } from "@components/artifact";
import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType } from "@components/errors";
import { AirtimeProvider } from "@components/interfaces";
import { sanitizePhoneNumber, getUniqueReference } from "@libs/utils";
import { AirtimeNetworks } from "@components/enums";
import { node, PaidOfferingHandler } from "@modules/offerings/index";
import { AirtimeDataBundleFacade } from "@modules/service-facades";
import moment from "moment-timezone";
moment.tz.setDefault("Africa/Lagos");

class Airtime extends PaidOfferingHandler {
	private vendor!: AirtimeProvider;

	public async value() {
		const result = (await this.vendor.vendAirtime({
			amount: this.params.amount,
			recipient: this.params.providerId,
			transactionRef: this.params.transactionReference,
			network: this.params.productType,
			merchantId: this.source.sourceId,
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
		return `N${this.params.amount} ${this.params.productType} Airtime for ${this.params.providerId}`;
	}

	public async beforePayment() {
		this.data.params.transactionReference = getUniqueReference();
	}

	public async validator() {
		return [
			node("providerId")
				.exists()
				.customSanitizer((value) => {
					return sanitizePhoneNumber(value);
				}),
			node("amount")
				.exists()
				.isNumeric()
				.withMessage("Amount should be numeric")
				.customValidator((value) => {
					return Number(value) >= 100 && Number(value) <= 100000;
				})
				.withMessage("Amount should be between the range N100 to N100,000 inclusive"),
			node("productType")
				.exists()
				.isIn(Object.values(AirtimeNetworks))
				.withMessage(`ProductType should be any of ${Object.values(AirtimeNetworks)}`),
		];
	}

	public async init() {
		const init = await super.init();
		this.vendor = await AirtimeDataBundleFacade.airtimeVendor(this.params.productType);
		return init;
	}
}

export = Airtime;
