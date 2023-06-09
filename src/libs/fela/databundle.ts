import { Fela } from "@config";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
const felaHeader = { Authorization: `Bearer ${Fela.authToken}` };
import axios from "axios";

export async function vendDatabundle(
	reqData: Interface.VendDatabundleRequestData,
): Promise<Interface.VendDatabundleResponse | Interface.ErrorResponse> {
	try {
		const payload = {
			offeringGroup: Enum.OfferingGroup.CORE,
			offeringName: Enum.OfferingName.DATA_BUNDLE,
			method: Enum.PaymentMethod.OFFLINE,
			params: {
				account_id: reqData.recipient,
				bundle_code: reqData.bundleCode,
				network: reqData.network,
			},
			user: {
				sessionId: reqData.transactionRef,
				source: Fela.sourceName,
				sourceId: reqData.merchantId,
				phoneNumber: reqData.merchantId,
			},
		};
		const { data } = await axios.post(`${Fela.baseUrl}/payment/offlinePay`, payload, { headers: felaHeader });
		const response = data.data;
		return {
			ok: true,
			data: {
				receipt: response.confirmCode,
				amount: response.amount,
				recipient: response.recipient,
				network: response.network,
				date: response.data,
				transactionReference: response.transactionTransaction,
			},
		};
	} catch (error: any) {
		console.error(`Error vending ${reqData.network} databundle`);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: `Error vending ${reqData.network} databundle`,
		};
	}
}

export async function fetchDatabundleProviders(): Promise<Interface.DatabundleProviderResponse<string> | Interface.ErrorResponse> {
	try {
		const { data } = await axios.get(`${Fela.baseUrl}/list/dataProviders`, { headers: felaHeader });
		const providers: string[] = [];

		//validate for possible empty data returned
		if (Object.keys(data.data).length > 0) {
			for (const iterator in data.data) {
				providers.push(iterator.toLowerCase());
			}
			return {
				ok: true,
				data: providers,
			};
		} else {
			return {
				ok: false,
				message: "No databundle providers available",
			};
		}
	} catch (error: any) {
		console.error(`Error fetching bundles`);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: "Error fetching databundle providers",
		};
	}
}

export async function fetchDatabundles(provider: string): Promise<Interface.FetchDatabundleResponse | Interface.ErrorResponse> {
	try {
		const { data } = await axios.get(`${Fela.baseUrl}/list/dataBundles?provider_code=${provider}`, { headers: felaHeader });
		const databundles: {
			code: string;
			title: string;
			price: number;
		}[] = [];

		//check for possible empty {data}
		if (Object.keys(data.data).length > 0) {
			for (const key in data.data) {
				databundles.push({
					code: data.data[key].code,
					title: data.data[key].title,
					price: data.data[key].price,
				});
			}
			return {
				ok: true,
				data: {
					provider: provider,
					dataBundles: databundles,
				},
			};
		} else {
			return {
				ok: false,
				message: `No dataBundles available for ${provider} provider`,
			};
		}
	} catch (error: any) {
		console.error(`Error fetching bundles`);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: "Error fetching databundles",
		};
	}
}

export async function getBundleAmount(
	reqData: Interface.GetDatabundleAmountRequestData,
): Promise<Interface.GetDatabundleAmountResponse | Interface.ErrorResponse> {
	try {
		const { bundleCode, provider } = reqData;
		const callResp = await fetchDatabundles(provider);

		if ("data" in callResp) {
			const { data } = callResp;
			let response: Interface.GetDatabundleAmountResponse | null = null;
			for (const iterator of data.dataBundles) {
				if (iterator.code === bundleCode) {
					response = {
						ok: true,
						data: {
							price: iterator.price,
							name: iterator.title,
						},
					};
				}
			}
			if (!response) {
				return {
					ok: false,
					message: "Invalid bundle code provided",
				};
			} else {
				return response;
			}
		} else {
			return {
				ok: false,
				message: callResp.message,
			};
		}
	} catch (error: any) {
		console.error("Error getting bundle amount");
		console.error(error);
		return {
			ok: false,
			message: "Error getting bundle amount",
		};
	}
}
