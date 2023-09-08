import { InvalidArgumentError, ErrorType } from "@components/errors";
import { App, Fela as FelaConfig } from "@config";
import { AirtimeNetworks, DataNetworks } from "@components/enums";
import { DataProvider, Services } from "@components/interfaces";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
const felaHeader = { Authorization: `Bearer ${FelaConfig.authToken}` };
import axios from "axios";

class FelaDataBundle implements DataProvider {
	public services: Services = {
		services: {
			airtime: ["MTN", "Airtel", "Glo", "Etisalat"],
			electricity: ["AEDC", "EKEDC", "EEDC", "IKEDC", "JEDC", "KAEDCO", "KEDCO", "BEDC"],
			cableTv: ["DSTV", "GOTV", "Startimes", "Showmax"],
			dataBundle: ["MTN", "Airtel", "Glo", "Etisalat", "Smile", "Spectranet"],
		},
	};

	public async fetchAirtimeProviders(): Promise<Interface.ErrorResponse | Interface.ProviderResponse> {
		try {
			const { data } = await axios.get(`${FelaConfig.baseUrl}/list/airtimeProviders`, {
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
						message: `Unable to retrieve airtime providers. Please try again`,
					},
				};
			}
		} catch (error: any) {
			console.error(`Error fetching airtime providers`);
			if (error.response) {
				console.error(error.response.data);
			} else {
				console.error(error);
			}
			return {
				ok: false,
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: `Error fetching airtime providers. Please try again`,
				},
			};
		}
	}

	public getAirtimeNetwork(network: string) {
		const networks = Object.values(AirtimeNetworks);
		const networkExist = false;

		if (networks.includes(network as unknown as AirtimeNetworks)) {
			return network;
		} else {
			return networkExist;
		}
	}

	public async vend(
		requestData: Interface.VendDatabundleRequestData,
	): Promise<Interface.VendDatabundleResponse | Interface.ErrorResponse> {
		try {
			const network = this.getAirtimeNetwork(requestData.network);
			if (!network) {
				App.ErrorHandler.handle(new InvalidArgumentError("Could not resolve Network Provider serviceId").setData(requestData));
				throw new InvalidArgumentError("Could not resolve Network Provider serviceId").setData(requestData);
			}
			const payload = {
				offeringGroup: Enum.OfferingGroup.CORE,
				offeringName: Enum.OfferingName.DATA_BUNDLE,
				method: Enum.PaymentMethod.OFFLINE,
				params: {
					account_id: requestData.recipient,
					bundle_code: requestData.bundleCode,
					network: requestData.network,
				},
				user: {
					sessionId: requestData.transactionRef,
					source: FelaConfig.sourceName,
					sourceId: requestData.merchantId,
					phoneNumber: requestData.merchantId,
				},
			};
			const { data } = await axios.post(`${FelaConfig.baseUrl}/payment/offlinePay`, payload, { headers: felaHeader });
			const response = data.data;
			return {
				ok: true,
				data: {
					receipt: response.confirmCode,
					amount: response.amount,
					recipient: response.recipient,
					network: response.network,
					date: response.date,
				},
			};
		} catch (error: any) {
			console.error(`Error vending ${requestData.network} databundle`);
			if (error.response) {
				console.error(error.response.data);
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: `Error vending ${requestData.network} databundle`,
						details: error.response.data,
					},
				};
			} else {
				console.error(error);
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: `Error vending ${requestData.network} databundle`,
						details: error.response,
					},
				};
			}
		}
	}

	public async fetchDatabundleProviders(): Promise<Interface.ProviderResponse | Interface.ErrorResponse> {
		try {
			const { data } = await axios.get(`${FelaConfig.baseUrl}/list/dataProviders`, { headers: felaHeader });

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
						message: "Unabale to retrieve databundle providers. Please try again",
					},
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
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: "Error fetching databundle providers. Please try again",
				},
			};
		}
	}

	public async getDatabundles(provider: string): Promise<Interface.FetchDatabundleResponse | Interface.ErrorResponse> {
		try {
			const { data } = await axios.get(`${FelaConfig.baseUrl}/list/dataBundles?provider_code=${provider}`, { headers: felaHeader });

			// check for possible empty {data}
			if (Object.keys(data.data).length > 0) {
				return {
					ok: true,
					data: {
						provider,
						dataBundles: data.data,
					},
				};
			} else {
				return {
					ok: false,
					data: {
						type: ErrorType.BADREQUEST,
						message: `No dataBundles available for ${provider} provider`,
					},
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
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: "Error fetching databundles. Please try again",
				},
			};
		}
	}

	public async getBundleAmount(
		reqData: Interface.GetDatabundleAmountRequestData,
	): Promise<Interface.GetDatabundleAmountResponse | Interface.ErrorResponse> {
		try {
			const { bundleCode, provider } = reqData;
			const { data } = await this.getDatabundles(provider);
			if ("dataBundles" in data) {
				let response: Interface.GetDatabundleAmountResponse | null = null;
				for (const iterator in data.dataBundles) {
					if (iterator === bundleCode) {
						response = {
							ok: true,
							data: {
								price: data.dataBundles[iterator].price,
								name: data.dataBundles[iterator].title,
							},
						};
					}
				}
				if (!response) {
					return {
						ok: false,
						data: {
							type: ErrorType.BADREQUEST,
							message: "Invalid bundle code provided",
						},
					};
				} else {
					return response;
				}
			} else {
				return {
					ok: false,
					data: {
						type: data.type,
						message: data.message,
					},
				};
			}
		} catch (error: any) {
			console.error("Error getting bundle amount");
			console.error(error);
			return {
				ok: false,
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: "Error getting bundle amount. Please try again",
				},
			};
		}
	}

	public async getDataBundleNetwork(network: string) {
		const networks = Object.values(DataNetworks);
		const networkExist = false;

		if (networks.includes(network as unknown as DataNetworks)) {
			return network;
		} else {
			return networkExist;
		}
	}
}

export default new FelaDataBundle();
