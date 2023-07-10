import { Artifact } from "@components/artifact";
import { ServiceUnavailableError } from "@components/errors";
import { AirtimeProvider } from "@components/interfaces";
import { sanitizePhoneNumber } from "@libs/utils";
import { AirtimeNetworks } from "@components/enums";
import { node, PaidOfferingHandler } from "@modules/offerings";
import { AirtimeDataBundleFacade } from "@modules/service-facades";
import moment from "moment-timezone";
moment.tz.setDefault("Africa/Lagos");

class Airtime extends PaidOfferingHandler {
	private vendor!: AirtimeProvider;

	public async value() {
		const { data, ok } = await this.vendor.vendAirtime({
			amount: this.params.amount,
			recipient: this.params.recipient,
			transactionRef: this.source.sessionId,
			network: this.params.network,
			merchantId: this.source?.sourceId as string,
		});

		if (ok) {
			return new Artifact(data, "Fulfillment Successful");
		}

		throw new ServiceUnavailableError("Airtime:Fulfillment").setData({ request: this.data, response: data, params: this.params });
	}

	public async getAmount() {
		return await this.init().then(() => this.params.amount);
	}

	public async getDescription() {
		return `N${this.params.amount} ${this.params.network} Airtime for ${this.params.recipient}`;
	}

	// public async beforePayment() {
	// 	this.params.numberRef = ;
	// }

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
					return Number(value) >= 50 && Number(value) <= 100000;
				})
				.withMessage("Amount should be between the range N50 to N100,000 inclusive"),
			node("productType")
				.exists()
				.isIn(Object.values(AirtimeNetworks))
				.withMessage(`network should be any of ${Object.values(AirtimeNetworks)}`),
		];
	}

	public async init() {
		const init = await super.init();
		this.vendor = await AirtimeDataBundleFacade.airtimeVendor(this.params.network);
		return init;
	}
}

export = Airtime;
