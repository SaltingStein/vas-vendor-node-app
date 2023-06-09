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

export async function requeryMeterVend(transId: string): Promise<Interface.RequeryVendResponse | Interface.ErrorResponse> {
	try {
		const requestPayload = {
			Username: Phedc.userName,
			apikey: Phedc.apiKey,
			transactionNo: transId,
		};
		const { data } = await axios.post(`${Phedc.baseUrl}/GettransactionInfo`, requestPayload);

		// console.log(resp.data);
		if (data[0]) {
			const details = {
				"Arrears (NGN)": "0.00",
				"Energy Value (NGN)": "0.00",
				"Preload (NGN)": "0.00",
				"VAT (NGN)": "0.00",
			};
			const transctionDetails: Interface.Details[] = data[0].DETAILS;
			for (const iterator of transctionDetails) {
				details[iterator.HEAD] = iterator.AMOUNT;
			}
			return {
				ok: true,
				data: {
					meterNo: data[0].METER_NO,
					receipt: data[0].RECEIPTNUMBER,
					tarriffIndex: data[0].CUSTOMER_NO,
					date: data[0].PAYMENTDATETIME,
					amount: data[0].AMOUNT,
					status: data[0].AMOUNT,
					units: data[0].UNITSACTUAL,
					tarriff: data[0].TARIFF,
					...details,
				},
			};
		} else {
			return {
				ok: false,
				message: "No record found",
			};
		}
	} catch (error: any) {
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}

		return {
			ok: false,
			message: "No record found",
		};
	}
}
