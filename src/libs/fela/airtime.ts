import { Fela } from "@config";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
const felaHeader = { Authorization: `Bearer ${Fela.authToken}` };
import axios from "axios";

export const AirtimeProviders: { [x: string]: string } = {
	MTN: "MTN",
	GLO: "Glo",
	AIRTEL: "Airtel",
	ETISALAT: "Etisalat",
};

export async function vendAirtime(
	requestData: Interface.VendAirtimeRequestData,
): Promise<Interface.ErrorResponse | Interface.VendAirtimeResponse> {
	const payload = {
		offeringGroup: Enum.OfferingGroup.CORE,
		offeringName: Enum.OfferingName.AIRTIME,
		method: Enum.PaymentMethod.OFFLINE,
		params: {
			recipient: requestData.recipient,
			amount: requestData.amount,
			network: AirtimeProviders[requestData.network.toUpperCase()],
		},
		user: {
			sessionId: requestData.transactionRef,
			source: Fela.sourceName,
			sourceId: requestData.merchantId,
			phoneNumber: requestData.merchantId,
		},
	};

	try {
		const { data }: any = await axios.post(`${Fela.baseUrl}/payment/offlinePay`, payload, {
			headers: felaHeader,
		});

		const response = data.data;
		return {
			ok: true,
			data: {
				receipt: response.confirmCode,
				amount: response.amount,
				recipient: response.recipient,
				network: response.network,
				date: response.date,
				transactionReference: requestData.transactionRef,
			},
		};
	} catch (error: any) {
		console.error(`Error vending ${requestData.network} airtime`);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: `Error vending ${requestData.network} airtime`,
		};
	}
}

export async function fetchAirtimeProviders(): Promise<Interface.ErrorResponse | Interface.AirtimeProviderResponse<string>> {
	try {
		const { data } = await axios.get(`${Fela.baseUrl}/list/airtimeProviders`, {
			headers: felaHeader,
		});

		const providers: string[] = [];

		for (const iterator in data.data) {
			providers.push(iterator.toLowerCase());
		}
		return {
			ok: true,
			data: providers,
		};
	} catch (error: any) {
		console.error(`Error fetching airtime providers`);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: `Error fetching airtime providers`,
		};
	}
}
