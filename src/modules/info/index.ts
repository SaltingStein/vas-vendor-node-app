import { App } from "@config";
import { Artifact } from "@components/artifact";
import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType, NotFoundError } from "@components/errors";
import { ElectricityProvider, Services } from "@components/interfaces";
import { ElectricityFacade } from "@modules/service-facades";
import { node } from "@libs/validator";
import { singleArgAssert, validate } from "../mixins";
import { listSources } from "../lists";
import { MeterNumbers } from "@models/meterNumbers";
export interface Info {
	[x: string]: any;
}
class InfoSource {
	[key: string]: (data?: any, app?: any) => Awaited<Promise<Info>>;
	@singleArgAssert("provider_code", "provider_id", "product_type")
	@validate([node("provider_code").exists(), node("provider_id").exists(), node("product_type").exists()])
	public async meterNo(data: { provider_code: string; provider_id: string; product_type: string }) {
		const { provider_code: providerCode, provider_id: providerId, product_type: productType } = data;
		const vendor = (await ElectricityFacade.electrcityVendor(productType)) as unknown as ElectricityProvider & Services;

		if (vendor) {
			// if (!App.PROD) {
			// 	const response = (await MeterNumbers.findOne(
			// 		{ disco: productType, meterNumber: providerId, accountType: providerCode },
			// 		{ details: 1 },
			// 	)) as unknown as {
			// 		details: object[];
			// 	};
			// 	if (response) {
			// 		return new Artifact({ ...response.details }, "Account resolved successfully");
			// 	} else {
			// 		throw new NotFoundError(`Customer not found with account or meter number ${providerId}`).setData({
			// 			productType,
			// 			providerCode,
			// 			providerId,
			// 		});
			// 	}
			// }
			const { data } = await vendor.verifyMeter({
				disco: productType,
				meterNumber: providerId,
				serviceCode: providerCode,
			});
			if ("message" in data) {
				switch (data.type) {
					case ErrorType.SERVICEUNAVAILABLE:
						throw new ServiceUnavailableError(data.message).setData({
							productType,
							providerCode,
							providerId,
						});
					case ErrorType.BADREQUEST:
						throw new BadRequestError(data.message).setData({
							productType,
							providerCode,
							providerId,
						});
					case ErrorType.NOTFOUND:
						throw new NotFoundError(data.message).setData({
							productType,
							providerCode,
							providerId,
						});
					default:
						throw new ServerError().setData({
							productType,
							providerCode,
							providerId,
						});
				}
			} else {
				return data;
			}
		} else {
			throw new BadRequestError(`Invalid productType(${productType}) provided. Please check and try again`).setData({
				productType,
				providerId,
				providerCode,
			});
		}
	}

	@singleArgAssert("provider_id", "product_type", "provider_code")
	@validate([
		node("product_type")
			.exists()
			.customValidator(async (value) => {
				const providers = (await listSources.cableProviders()) as {
					[T: string]: {
						code: string;
						title: string;
						providerId: string;
					};
				};
				const providerNames = Object.keys(providers);
				if (providerNames.length > 0 && providers[value]) {
					return true;
				} else {
					return false;
				}
			})
			.withMessage(`Invalid productType provided`),
		node("provider_id").exists(),
		node("provider_code").exists(),
	])
	public async tvSmartCard(data: any) {
		const providers = (await listSources.cableProviders()) as {
			[T: string]: {
				code: string;
				title: string;
				providerId: string;
			};
		};
		data.product_type = providers[data.product_type].providerId;
		if (!App.PROD) {
			switch (data.product_type) {
				case "2":
					return new Artifact(
						{
							name: "Default Name",
							providerId: `${data.provider_id}`,
							providerType: "Dstv",
						},
						"Smart card resolved successfully",
					);
				case "3":
					return {
						customer: "Default Name",
						providerId: `${data.provider_id}`,
						providerType: "Gotv",
					};
				case "80":
					return {
						customer: "Default Name",
						providerId: `${data.provider_id}`,
						providerType: "Startimes",
					};
				case "113":
					return {
						customer: "Default Name",
						providerId: `${data.provider_id}`,
						providerType: "Showmax",
					};
			}
		}
		// return new Artifact(await TvFacade.resolveSmartCard(data), "Smart card resolved successfully");
	}
}

export const infoSources = new InfoSource();
