import { App } from "@config";
import { Artifact } from "@components/artifact";
import { BadRequestError, ServerError, ServiceUnavailableError, ErrorType, NotFoundError } from "@components/errors";
import { ElectricityProvider, Services } from "@components/interfaces";
import { ElectricityFacade } from "@modules/service-facades";
import { node } from "@libs/validator";
import { singleArgAssert, validate } from "../mixins";
import { MeterNumbers } from "@models/meterNumbers";
export interface Info {
	[x: string]: any;
}

class Electricty {
	[key: string]: (data?: any, app?: any) => Awaited<Promise<Info>>;
	@singleArgAssert("providerCode", "providerId", "productType")
	@validate([node("providerCode").exists(), node("providerId").exists(), node("productType").exists()])
	public async meterNo(data: { providerCode: string; providerId: string; productType: string }) {
		const { providerCode, providerId, productType } = data;
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
}

export const electricity = new Electricty();
