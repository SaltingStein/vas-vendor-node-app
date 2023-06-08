import { Fela } from "@config";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
const felaHeader = { Authorization: `Bearer ${Fela.authToken}` };
import axios from "axios";

export async function vendCabletv(
	requestData: Interface.VendCableTVRequestData,
): Promise<Interface.ErrorResponse | Interface.VendCableTVResponse> {
	const payload = {
		offeringGroup: Enum.OfferingGroup.CORE,
		offeringName: Enum.OfferingName.CABLETV,
		method: Enum.PaymentMethod.OFFLINE,
		params: {
			smartcard_number: requestData.smartcardNo,
			provider_code: requestData.providerCode,
			service_code: requestData.bouquetCode,
		},
		user: {
			sessionId: requestData.transactionRef,
			source: Fela.sourceName,
			sourceId: requestData.merchantId,
			phoneNumber: requestData.merchantId,
		},
	};

	try {
		const { data } = await axios.post(`${Fela.baseUrl}/payment/offlinePay`, payload, {
			headers: felaHeader,
		});
		const response = data.data;
		return {
			ok: true,
			data: {
				provider: response.provider,
				packageName: response.packageName,
				smartCardNo: response.smartCardNo,
				amount: response.amount,
				receipt: response.receiptId,
				date: response.date,
			},
		};
	} catch (error: any) {
		console.error(`Error vending cabletv`);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: `Error vending cabletv`,
		};
	}
}

async function fetchCabletvProviders(): Promise<Interface.ErrorResponse | Interface.CableTVProviderResponse> {
	try {
		const { data }: any = await axios.get(`${Fela.baseUrl}/list/cableProviders`, {
			headers: felaHeader,
		});
		const providers: {
			code: string;
			title: string;
		}[] = [];

		for (const iterator in data.data) {
			const provider = data.data(iterator);
			providers.push(provider);
		}

		return {
			ok: true,
			data: providers,
		};
	} catch (error: any) {
		console.error(`Error fetching cabletv providers`);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: `Error fetching cabletv providers`,
		};
	}
}

async function fetchBouquets(provider: string): Promise<Interface.ErrorResponse | Interface.CableTVProviderResponse> {
	try {
		const { data } = await axios.get(`${Fela.baseUrl}/list/cableBouquets?provider_code=${provider}`, {
			headers: felaHeader,
		});
		const bouquets: {
			code: string;
			title: string;
			price: string;
			slug: string;
		}[] = [];
		// let response: any;
		if (Object.keys(data.data).length > 0) {
			for (const bouquet in data.data) {
				bouquets.push(data.data[bouquet]);
			}
			return {
				ok: true,
				data: bouquets,
			};
		} else {
			return {
				ok: false,
				message: "No bouquet available for cabletv provider",
			};
		}

		// return response;
	} catch (error: any) {
		console.error(`Error fetching cabletv bouquets`);
		if (error.response && error.response.data.message.includes("Invalid provider code")) {
			console.error(error.response.data);
			return {
				ok: false,
				message: "Provider code is invalid",
			};
		} else {
			return {
				ok: false,
				message: "An error occurred while fetching bouquets",
			};
		}
	}
}

async function getBouquetAmount(
	requestData: Interface.GetBouquetAmountRequestData,
): Promise<Interface.ErrorResponse | Interface.GetBouquetAmountResponse> {
	try {
		const { provider, bouquetCode } = requestData;
		const callResp = await fetchBouquets(provider);
		if ("data" in callResp) {
			const { data } = callResp;
			let response: Interface.GetBouquetAmountResponse | null = null;
			for (const bouquet of data) {
				if (bouquet.code === bouquetCode) {
					response = {
						ok: true,
						data: {
							price: bouquet.price,
							name: bouquet.title,
						},
					};
				}
			}

			if (!response) {
				return {
					ok: false,
					message: "Invalid bouquet code provided",
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
	} catch (error) {
		console.error("Error getting bouquet amount");
		console.error(error);
		return {
			ok: false,
			message: "Error getting bouquet amount",
		};
	}
}

async function getProviderName(providerCode: string): Promise<Interface.GetProviderPropertyResponse | Interface.ErrorResponse> {
	try {
		const providers = await fetchCabletvProviders();
		let response: Interface.GetProviderPropertyResponse | null = null;

		if ("data" in providers) {
			for (const provider of providers.data) {
				if (provider.code === providerCode) {
					response = {
						ok: true,
						data: {
							name: provider.title,
						},
					};
				}
			}

			if (!response) {
				return {
					ok: false,
					message: "Invalid provider code provided",
				};
			} else {
				return response;
			}
		} else {
			return {
				ok: false,
				message: providers.message,
			};
		}
	} catch (error) {
		console.error("Error getting cabletv provider name");
		console.error(error);
		return {
			ok: false,
			message: "Error getting cabletv provider name",
		};
	}
}

async function getProviderCode(providerName: string): Promise<Interface.GetProviderPropertyResponse | Interface.ErrorResponse> {
	try {
		const providers = await fetchCabletvProviders();
		let response: Interface.GetProviderPropertyResponse | null = null;

		if ("data" in providers) {
			for (const provider of providers.data) {
				if (provider.title === providerName) {
					response = {
						ok: true,
						data: {
							code: provider.code,
						},
					};
				}
			}

			if (!response) {
				return {
					ok: false,
					message: "Invalid provider name provided",
				};
			} else {
				return response;
			}
		} else {
			return {
				ok: false,
				message: providers.message,
			};
		}
	} catch (error) {
		console.error("Error getting cabletv provider code");
		console.error(error);
		return {
			ok: false,
			message: "Error getting cabletv provider code",
		};
	}
}

async function verifySmartCardNo(
	requestData: Interface.VerifySmartCardNoRequestData,
): Promise<Interface.VerifySmartCardNoResponse | Interface.ErrorResponse> {
	try {
		const params = {
			number: requestData.cardNo,
			provider_code: requestData.providerCode,
			service_code: requestData.bouquetCode,
		};

		const { data } = await axios.get(`${Fela.baseUrl}/info/tvSmartCard`, {
			params,
			headers: felaHeader,
		});

		return {
			ok: true,
			data: data.data,
		};
	} catch (error: any) {
		console.error(`Error verifying smartcard No`);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: "Error verifying smartcard No",
		};
	}
}

module.exports = {
	vendCabletv,
	fetchBouquets,
	fetchCabletvProviders,
	getBouquetAmount,
	verifySmartCardNo,
	getProviderName,
	getProviderCode,
};
