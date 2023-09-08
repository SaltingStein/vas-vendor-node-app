import { ErrorType } from "@components/errors";
import { Fela as FelaConfig } from "@config";
import { CableTvProvider, Services } from "@components/interfaces";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
const felaHeader = { Authorization: `Bearer ${FelaConfig.authToken}` };
import axios from "axios";

class FelaCableTv implements CableTvProvider {
	public services: Services = {
		services: {
			airtime: ["MTN", "Airtel", "Glo", "Etisalat"],
			electricity: ["AEDC", "EKEDC", "EEDC", "IKEDC", "JEDC", "KAEDCO", "KEDCO", "BEDC"],
			cableTv: ["DSTV", "GOTV", "Startimes", "Showmax"],
			dataBundle: ["MTN", "Airtel", "Glo", "Etisalat", "Smile", "Spectranet"],
		},
	};
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

	public async vend(requestData: Interface.VendCableTVRequestData): Promise<Interface.ErrorResponse | Interface.VendCableTVResponse> {
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
				source: FelaConfig.sourceName,
				sourceId: requestData.merchantId,
				phoneNumber: requestData.merchantId,
			},
		};

		try {
			const { data } = await axios.post(`${FelaConfig.baseUrl}/payment/offlinePay`, payload, {
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
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: `An error occurred while vending cabletv. Please try again`,
				},
			};
		}
	}

	public async fetchCabletvProviders(): Promise<Interface.ErrorResponse | Interface.CableTVProviderResponse> {
		try {
			const { data }: any = await axios.get(`${FelaConfig.baseUrl}/list/cableProviders`, {
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
						message: `Unable to retrieve cabletv providers. Please try again`,
					},
				};
			}
		} catch (error: any) {
			console.error(`Error fetching cabletv providers`);
			if (error.response) {
				console.error(error.response.data);
			} else {
				console.error(error);
			}
			return {
				ok: false,
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: `Error fetching cabletv providers. Please try again`,
				},
			};
		}
	}

	public async fetchBouquets(provider: string): Promise<Interface.ErrorResponse | Interface.CableTVProviderResponse> {
		try {
			const { data } = await axios.get(`${FelaConfig.baseUrl}/list/cableBouquets?provider_code=${provider}`, {
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
						type: ErrorType.BADREQUEST,
						message: "No bouquet available for cabletv provider",
					},
				};
			}

			// return response;
		} catch (error: any) {
			console.error(`Error fetching cabletv bouquets`);
			if (error.response && error.response.data.message.includes("Invalid provider code")) {
				console.error(error.response.data);
				return {
					ok: false,
					data: {
						type: ErrorType.BADREQUEST,
						message: "Provider code is invalid",
					},
				};
			} else {
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: "An error occurred while fetching bouquets",
					},
				};
			}
		}
	}

	public async getBouquetAmount(
		requestData: Interface.GetBouquetAmountRequestData,
	): Promise<Interface.ErrorResponse | Interface.GetBouquetAmountResponse> {
		try {
			const { provider, bouquetCode } = requestData;
			const { data, ok } = await this.fetchBouquets(provider);
			// const { data } = callResp;
			if (ok) {
				let response: any;
				for (const bouquet of Object.values(data as unknown as Interface.GetBouquetAmountResponse)) {
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
						data: {
							type: ErrorType.BADREQUEST,
							message: "Invalid bouquet code provided",
						},
					};
				} else {
					return response;
				}
			} else {
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: "Unable to retrieve bouquet amount. Please try again",
					},
				};
			}
		} catch (error) {
			console.error("Error getting bouquet amount");
			console.error(error);
			return {
				ok: false,
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: "Error getting bouquet amount. Please try again",
				},
			};
		}
	}

	public async getProviderName(providerCode: string): Promise<Interface.GetProviderPropertyResponse | Interface.ErrorResponse> {
		try {
			const { data, ok } = await this.fetchCabletvProviders();
			let response: Interface.GetProviderPropertyResponse | null = null;
			if (ok) {
				for (const provider of Object.values(data as unknown as Interface.GetProviderPropertyResponse)) {
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
						data: {
							type: ErrorType.BADREQUEST,
							message: "Invalid provider code provided",
						},
					};
				} else {
					return response;
				}
			} else {
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: "Unable to retrieve cabletv provider name. Please try again",
					},
				};
			}
		} catch (error) {
			console.error("Error getting cabletv provider name");
			console.error(error);
			return {
				ok: false,
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: "Error getting cabletv provider name. Please try again",
				},
			};
		}
	}

	public async getProviderCode(providerName: string): Promise<Interface.GetProviderPropertyResponse | Interface.ErrorResponse> {
		try {
			const { data, ok } = await this.fetchCabletvProviders();
			let response: Interface.GetProviderPropertyResponse | null = null;

			if (ok) {
				for (const provider of Object.values(data as unknown as Interface.GetProviderPropertyResponse)) {
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
						data: {
							type: ErrorType.BADREQUEST,
							message: "Invalid provider code provided",
						},
					};
				} else {
					return response;
				}
			} else {
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: "Unable to retrieve cabletv provider code. Please try again",
					},
				};
			}
		} catch (error) {
			console.error("Error getting cabletv provider code");
			console.error(error);
			return {
				ok: false,
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: "Error getting cabletv provider code. Please try again",
				},
			};
		}
	}

	public async verifySmartCardNo(
		requestData: Interface.VerifySmartCardNoRequestData,
	): Promise<Interface.VerifySmartCardNoResponse | Interface.ErrorResponse> {
		try {
			const params = {
				number: requestData.cardNo,
				provider_code: requestData.providerCode,
				service_code: requestData.bouquetCode,
			};

			const { data } = await axios.get(`${FelaConfig.baseUrl}/info/tvSmartCard`, {
				params,
				headers: felaHeader,
			});

			const response = {
				customer: data.data.customer,
				customerNumber: data.data.customer_number,
				type: data.data.type,
			};

			return {
				ok: true,
				data: response,
			};
		} catch (error: any) {
			console.error(`Error verifying smartcard No`);
			if (error.response) {
				console.error(error.response.data);
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: "Error verifying smartcard No. Please try again",
						details: error.response.data,
					},
				};
			} else {
				console.error(error);
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: "Error verifying smartcard No. Please try again",
						details: error.response,
					},
				};
			}
		}
	}
}

export default new FelaCableTv();
