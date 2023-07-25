import { Artifact } from "@components/artifact";
import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType } from "@components/errors";
import { ElectricityProvider, Services } from "@components/interfaces";
import { getUniqueReference } from "@libs/utils";
import { node, PaidOfferingHandler } from "@modules/offerings/index";
import { ElectricityFacade } from "@modules/service-facades";
import moment from "moment-timezone";
moment.tz.setDefault("Africa/Lagos");

class Electricity extends PaidOfferingHandler {
	private vendor!: ElectricityProvider & Services;

	public async value() {
		const result = (await this.vendor.vendFelaElectricity({
			meterNumber: this.params.providerId,
			disco: this.params.providerCode,
			serviceCode: this.params.productType,
			amount: this.params.amount,
			merchantId: this.source.sourceId,
			transactionRef: this.params.transactionReference,
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
		return `N${this.params.amount} ${this.params.productType} Airtime for ${this.params.providerId}`;
	}

	public async beforePayment() {
		this.data.params.transactionReference = getUniqueReference();
	}

	public async validator() {
		return [
			node("productType")
				.exists()
				.isIn(Object.values(this.vendor.services["electricity"]))
				.withMessage(`params.productType should be any of ${Object.values(this.vendor.services["electricity"])}`),
			node("providerCode").exists().withMessage("params.providerCode is required"),
			node("providerId")
				.exists()
				.customValidator(async (value) => {
					const { ok, data } = await this.vendor.verifyMeter({
						disco: this.data.params.productType,
						meterNumber: value,
						serviceCode: this.data.params.providerCode,
					});

					if (ok) {
						this.data.params.meterInfo = data;
						return true;
					} else {
						return false;
					}
				})
				.withMessage(`Unable to verify params.providerId (${this.data.params.providerId}). Please check providerId and try again`),
		];
	}

	public async init() {
		const init = await super.init();
		this.vendor = (await ElectricityFacade.electrcityVendor(this.params.productType)) as unknown as ElectricityProvider & Services;
		return init;
	}
}

export = Electricity;
