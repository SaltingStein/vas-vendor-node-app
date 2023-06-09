import { Phedc, App } from "@config";
import * as Interface from "./interfaces";
import axios from "axios";

export async function verifyMeterNo(
	requestData: Interface.VerifyMeterNoRequestData,
): Promise<Interface.ErrorResponse | Interface.VerifyMeterNoResponse> {
	try {
		const requestPayload = {
			username: Phedc.userName,
			apikey: Phedc.apiKey,
			customerNumber: requestData.meterNo,
			Mobile_Number: App.contactPhone,
			mailid: App.contactEmail,
			CustomerType: requestData.serviceCode.toUpperCase(),
		};
		const { data } = await axios.post(`${Phedc.baseUrl}/GetCustomerInfo`, requestPayload);

		if (Array.isArray(data) && data[0]) {
			return {
				ok: true,
				data: {
					name: data[0].name,
					address: data[0].address,
					tarriffIndex: data[0].number,
					arrear: data[0].arrear,
				},
			};
		} else {
			return {
				ok: false,
				message: "Invalid meter number or service code provided.",
			};
		}
	} catch (error: any) {
		console.error("Error validating PHEDC direct meter No");
		if (error.response) {
			console.error(error.response.data);
		}
		console.error(error);
		return {
			ok: false,
			message: "Invalid meter number or service code provided.",
		};
	}
}
