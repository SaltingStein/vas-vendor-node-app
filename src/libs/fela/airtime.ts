import { InvalidArgumentError, ErrorType } from "@components/errors";
import { App, Fela as FelaConfig } from "@config";
import { AirtimeNetworks } from "@components/enums";
import { AirtimeProvider, Services } from "@components/interfaces";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
const felaHeader = { Authorization: `Bearer ${FelaConfig.authToken}` };
import axios from "axios";

class FelaAirtime implements AirtimeProvider {
	public services: Services = {
		services: {
			airtime: ["MTN", "Airtel", "Glo", "Etisalat"],
		},
	};
	public async vend(requestData: Interface.VendAirtimeRequestData): Promise<Interface.ErrorResponse | Interface.VendAirtimeResponse> {
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
				network,
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
}

export default new FelaAirtime();
