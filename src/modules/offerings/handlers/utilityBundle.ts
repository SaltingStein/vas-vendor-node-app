import { Artifact } from "@components/artifact";
import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType } from "@components/errors";
import { AirtimeProvider, ElectricityProvider, Services } from "@components/interfaces";
import { products } from "@controllers/vend";
import { sanitizePhoneNumber, getUniqueReference } from "@libs/utils";
import { node, PaidOfferingHandler } from "@modules/offerings/index";
import { AirtimeDataBundleFacade, ElectricityFacade } from "@modules/service-facades";
import moment from "moment-timezone";
moment.tz.setDefault("Africa/Lagos");

enum Reward {
	CASHTOKEN = "cashtoken",
}
class UtilityBundle extends PaidOfferingHandler {
	private vendor!: any;

	public async value() {
		let result: any;
		const { commissions } = this.getOrder();
		switch (this.params.utility.product) {
			case products.AIRTIME:
				result = await this.vendor.default.vend({
					amount: commissions.vendAmount,
					recipient: this.params.providerId,
					transactionRef: this.params.transactionReference,
					network: this.params.utility.provider,
					merchantId: this.source.sourceId,
				});
				break;
			case products.ELECTRICITY:
				result = await this.vendor.default.vend({
					meterNumber: this.params.providerId,
					disco: this.params.providerCode,
					serviceCode: this.params.productType,
					amount: this.params.amount,
					merchantId: this.source.sourceId,
					transactionRef: this.params.transactionReference,
				});
		}
		const { data, ok } = result;
		data.amount = this.params.amount;
		data.utilityBundle = {
			utility: this.params.utility.product,
			UtilityRate: commissions.vasRate,
			utilityAmount: commissions.vendAmount,
			reward: Reward.CASHTOKEN,
			rewardAmount: commissions.rewardAmount,
			rewardRate: commissions.rewardRate,
		};
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
		return `N${this.params.amount} ${this.params.utility.product} ${this.params.productName} for ${this.params.providerId}`;
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
					return Number(value) >= 100;
				})
				.withMessage("Amount should be greater than or equal to N100"),
			node("productType").exists(),
		];
	}

	public async init() {
		const init = await super.init();
		if (this.params.utility.product === products.AIRTIME) {
			this.vendor = (await AirtimeDataBundleFacade.airtimeVendor(this.params.utility.provider)) as unknown as AirtimeProvider;
		} else if (this.params.utility.product === products.ELECTRICITY) {
			this.vendor = (await ElectricityFacade.electrcityVendor(this.params.utility.provider)) as unknown as ElectricityProvider &
				Services;
		}
		return init;
	}
}

export = UtilityBundle;
