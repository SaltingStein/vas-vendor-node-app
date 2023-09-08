import { ErrorType } from "@components/errors";
import { Fela as FelaConfig } from "@config";
import { ElectricityProvider, Services } from "@components/interfaces";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
const felaHeader = { Authorization: `Bearer ${FelaConfig.authToken}` };
import axios from "axios";

class FelaElectricity implements Partial<ElectricityProvider> {
	public services: Services = {
		services: {
			electricity: ["AEDC", "EKEDC", "EEDC", "IKEDC", "JEDC", "KAEDCO", "KEDCO", "BEDC"],
		},
	};

	public async vend(
		requestData: Interface.VendElectrictyRequestData,
	): Promise<Interface.ErrorResponse | Interface.VendElectricityResponse> {
		try {
			const payload = {
				offeringGroup: Enum.OfferingGroup,
				offeringName: Enum.OfferingName,
				method: Enum.PaymentMethod,
				params: {
					meter_number: requestData.meterNumber,
					provider_code: requestData.disco,
					service_code: requestData.serviceCode,
					amount: requestData.amount,
				},
				user: {
					sessionId: requestData.transactionRef,
					source: FelaConfig.sourceName,
					sourceId: requestData.merchantId,
					phoneNumber: requestData.merchantId,
				},
			};
			const { data } = await axios.post(`${FelaConfig.baseUrl}/payment/offlinePay`, payload, {
				headers: felaHeader,
			});
			let response;
			if (requestData.disco === "BEDC") {
				response = {
					token: data.data.raw.token,
					receipt: data.data.raw.receipt_no,
					meterNumber: data.data.raw.meter_no,
					amount: data.data.raw.amount,
					date: data.data.raw.payment_datetime,
					units: data.data.raw.energy_units,
					tariff: "",
					additionalToken: data.data.additional_meter_token,
					accountType: requestData.disco,
				};
			} else {
				response = {
					token: data.data.token,
					receipt: data.data.receipt_no,
					meterNumber: data.data.meter_no,
					amount: data.data.amount,
					date: data.data.payment_datetime,
					units: data.data.energy_units,
					tariff: data.data.tokenInfo.tax || data.data.tokenInfo.tariff,
					additionalToken: "",
					accountType: requestData.disco,
				};
			}
			return {
				ok: true,
				data: response,
			};
		} catch (error: any) {
			console.error(`Error vending ${requestData.disco} for ${requestData.transactionRef}`);
			console.error(error);
			return {
				ok: false,
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: `Error vending ${requestData.disco} for ${requestData.transactionRef}`,
				},
			};
		}
	}

	public async fetchElectricityProviders(): Promise<Interface.GetElectricityProvidersResponse | Interface.ErrorResponse> {
		try {
			const { data } = await axios.get(`${FelaConfig.baseUrl}/list/electricityProviders`, {
				headers: felaHeader,
			});
			if (Object.keys(data.data).length > 0) {
				return {
					ok: true,
					data: data.data,
				};
			} else {
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: "Unable to retrieve electricity providers. Please try again later",
					},
				};
			}
		} catch (error: any) {
			console.error(`Error fetching electricity providers`);
			if (error.response) {
				console.error(error.response.data);
			} else {
				console.error(error);
			}
			return {
				ok: false,
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: "An error while fetching electricity providers. Please try again",
				},
			};
		}
	}

	public async verifyMeter(
		requestData: Interface.VerifyMeterNoRequestData,
	): Promise<Interface.VerifyMeterNoResponse | Interface.ErrorResponse> {
		try {
			const params = {
				number: requestData.meterNumber,
				provider_code: requestData.disco,
				service_code: requestData.serviceCode,
			};

			const { data } = await axios.get(`${FelaConfig.baseUrl}/info/meterNo`, {
				params,
				headers: felaHeader,
			});

			if ("data" in data) {
				const meterNoInfo: {
					name: string;
					address: string;
					util: string;
					phoneNumber: string;
					tarriffIndex?: string;
					minimumAmount?: string;
				} = data.data.customer;
				return {
					ok: true,
					data: {
						name: meterNoInfo.name,
						address: meterNoInfo.address,
						disco: meterNoInfo.util,
						phoneNumber: meterNoInfo.phoneNumber,
						tarriffIndex: meterNoInfo.tarriffIndex || "",
						minimumAmount: meterNoInfo.minimumAmount || "500",
					},
				};
			} else {
				return {
					ok: false,
					data: {
						type: ErrorType.BADREQUEST,
						message: data.message || "Unable to verify meter number.",
					},
				};
			}
		} catch (error: any) {
			console.error(`Error fetching meter No information`);
			if (error.response) {
				console.error(error.response.data);
				return {
					ok: false,
					data: {
						type: error.response?.data?.code === 404 ? ErrorType.NOTFOUND : ErrorType.SERVICEUNAVAILABLE,
						message:
							error.response?.data?.code === 404
								? error.response?.data?.message
								: "An error occurred while fetching meter No information. Please try again",
					},
				};
			} else {
				console.error(error);
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: "An error occurred while fetching meter No information. Please try again",
					},
				};
			}
		}
	}
}

export default new FelaElectricity();
