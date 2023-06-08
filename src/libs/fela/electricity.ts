import { Fela } from "@config";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
const felaHeader = { Authorization: `Bearer ${Fela.authToken}` };
import axios from "axios";
export async function vendFelaElectricity(
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
				source: Fela.sourceName,
				sourceId: requestData.merchantId,
				phoneNumber: requestData.merchantId,
			},
		};
		const { data } = await axios.post(`${Fela.baseUrl}/payment/offlinePay`, payload, {
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
				transactionReference: requestData.transactionRef,
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
				transactionReference: requestData.transactionRef,
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
			message: `Error vending ${requestData.disco} for ${requestData.transactionRef}`,
		};
	}
}

export async function fetchElectricityProviders(): Promise<Interface.GetElectricityProvidersResponse | Interface.ErrorResponse> {
	try {
		const { data } = await axios.get(`${Fela.baseUrl}/list/electricityProviders`, {
			headers: felaHeader,
		});

		if (Object.keys(data.data).length > 0) {
			const response: {
				code: string;
				title: string;
				serviceCodes: {
					code: string;
					title: string;
				}[];
			}[] = [];
			for (const iterator in data.data) {
				const provider = data.data[iterator];
				response.push({
					code: provider.code,
					title: provider.title,
					serviceCodes: provider.packages,
				});
			}

			return {
				ok: true,
				data: response,
			};
		} else {
			return {
				ok: false,
				message: "Unable to retrieve electricity providers. Please try again later",
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
			message: "An error while fetching electricity providers",
		};
	}
}

export async function verifyMeter(
	requestData: Interface.VerifyMeterNoRequestData,
): Promise<Interface.VerifyMeterNoResponse | Interface.ErrorResponse> {
	try {
		const params = {
			number: requestData.meterNo,
			provider_code: requestData.disco,
			service_code: requestData.serviceCode,
		};

		const { data } = await axios.get(`${Fela.baseUrl}/info/meterNo`, {
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
				message: data.message || "Unable to verify meter number.",
			};
		}
	} catch (error: any) {
		console.error(`Error fetching meter No information`);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: "An error while fetching meter No information",
		};
	}
}
