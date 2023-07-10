import { Fela } from "@config";
import * as Interface from "./interfaces";
const felaHeader = { Authorization: `Bearer ${Fela.authToken}` };
import axios from "axios";
import { ErrorType } from "@components/errors";

export async function fetchOrderDetails(transactionRef: string): Promise<Interface.FetchOrderResponse | Interface.ErrorResponse> {
	try {
		const { data } = await axios.get(`${Fela.baseUrl}/info/orderRequery?transactionRef=${transactionRef}`, { headers: felaHeader });
		const response = data.data;
		if (Object.keys(response).length > 0) {
			return {
				ok: true,
				message: response.message,
				data: {
					transactionRef: response.transactionRef,
					status: response.status,
					description: response.description,
					initiator: response.initiator,
					createdAt: response.createdAt,
					transactionParams: {
						meterNumber: response.transactionParams.meter_number,
						providerCode: response.transactionParams.provider_code,
						serviceCode: response.transactionParams.service_code,
						amount: response.transactionParams.account,
						numberRef: response.transactionParams.numberRef,
					},
				},
			};
		} else {
			return {
				ok: false,
				data: {
					type: ErrorType.NOTFOUND,
					message: `No order with transaction ref (${transactionRef}) found`,
				},
			};
		}
	} catch (error: any) {
		console.error(`Error fetching order with transaction ref  (${transactionRef})`);
		console.error(error);
		return {
			ok: false,
			data: {
				type: ErrorType.SERVICEUNAVAILABLE,
				message: `Error fetching order with transaction ref  (${transactionRef})`,
			},
		};
	}
}
