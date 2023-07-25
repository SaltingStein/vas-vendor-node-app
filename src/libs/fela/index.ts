import { InvalidArgumentError, ErrorType } from "@components/errors";
import { App, Fela as FelaConfig } from "@config";
import { AirtimeNetworks, DataNetworks } from "@components/enums";
import { AirtimeProvider, DataProvider, ElectricityProvider, CableTvProvider, Services } from "@components/interfaces";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
const felaHeader = { Authorization: `Bearer ${FelaConfig.authToken}` };
import axios from "axios";

class Fela implements AirtimeProvider, DataProvider, Partial<ElectricityProvider>, CableTvProvider {
	public services: Services = {
		services: {
			airtime: ["MTN", "Airtel", "Glo", "Etisalat"],
			electricity: ["AEDC", "EKEDC", "EEDC", "IKEDC", "JEDC", "KAEDCO", "KEDCO", "BEDC"],
			cableTv: ["dstv", "gotv", "startimes", "showmax"],
			dataBundle: ["mtn", "airtel", "glo", "etisalat", "smile", "spectranet"],
		},
	};
	public async vendAirtime(
		requestData: Interface.VendAirtimeRequestData,
	): Promise<Interface.ErrorResponse | Interface.VendAirtimeResponse> {
		const network = this.getAirtimeNetwork(requestData.network);
		if (!network) {
			App.ErrorHandler.handle(new InvalidArgumentError("Could not resolve Network Provider serviceId").setData(requestData));
			throw new InvalidArgumentError("Could not resolve Network Provider serviceId").setData(requestData);
		}
		const payload = {
			offeringGroup: Enum.OfferingGroup.CORE,
			offeringName: Enum.OfferingName.AIRTIME,
			method: Enum.PaymentMethod.OFFLINE,
			params: {
				recipient: requestData.recipient,
				amount: requestData.amount,
				network: network,
			},
			user: {
				sessionId: requestData.transactionRef,
				source: FelaConfig.sourceName,
				sourceId: requestData.merchantId,
				phoneNumber: requestData.merchantId,
			},
		};

		try {
			const { data }: any = await axios.post(`${FelaConfig.baseUrl}/payment/offlinePay`, payload, {
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
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: `Error vending ${requestData.network} airtime`,
						details: error.response.data,
					},
				};
			} else {
				console.error(error);
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: `Error vending ${requestData.network} airtime`,
						details: error.response,
					},
				};
			}
		}
	}

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

	public async vendDatabundle(
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
					date: response.data,
					transactionReference: response.transactionTransaction,
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

			//check for possible empty {data}
			if (Object.keys(data.data).length > 0) {
				return {
					ok: true,
					data: {
						provider: provider,
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

	public async vendFelaElectricity(
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

	public async vendCableTv(
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

export default new Fela();
