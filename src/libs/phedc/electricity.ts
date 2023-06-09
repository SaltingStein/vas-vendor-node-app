import { Phedc, App } from "@config";
import * as Interface from "./interfaces";
import * as Enums from "./enums";
import axios from "axios";
import moment from "moment";

export async function verifyMeterNo(
	requestData: Interface.VerifyMeterNoRequestData,
): Promise<Interface.ErrorResponse | Interface.VerifyMeterNoResponse> {
	try {
		const requestPayload = {
			username: Phedc.userName,
			apikey: Phedc.apiKey,
			customerNumber: requestData.meterNumber,
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
			const details = filterDetails(data[0].DETAILS);
			return {
				ok: true,
				data: {
					meterNumber: data[0].METER_NO,
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

export async function vendElectricity(
	requestData: Interface.VendElectrictyRequestData,
): Promise<Interface.VendElectricityResponse | Interface.ErrorResponse> {
	try {
		const now = moment().format("DD-MM-YYYY HH:mm:ss");
		const requestPayload = {
			Username: Phedc.userName,
			apikey: Phedc.apiKey,
			PaymentLogId: requestData.transactionRef,
			CustReference: requestData.tarriffIndex,
			AlternateCustReference: requestData.meterNumber,
			Amount: requestData.amount,
			PaymentMethod: Enums.PaymentMethod.WALLET,
			PaymentReference: requestData.transactionRef,
			ChannelName: null,
			Location: null,
			PaymentDate: now,
			InstitutionId: null,
			InstitutionName: null,
			BankName: null,
			BranchName: null,
			CustomerName: requestData.customerName,
			OtherCustomerInfo: null,
			ReceiptNo: null,
			CollectionsAccount: null,
			BankCode: null,
			CustomerAddress: requestData.address,
			CustomerPhoneNumber: App.contactPhone,
			DepositorName: null,
			DepositSlipNumber: null,
			PaymentCurrency: Enums.Currency.NGN,
			ItemName: null,
			ItemCode: Enums.Codes.ITEM,
			ItemAmount: requestData.amount,
			PaymentStatus: Enums.Status.SUCCESS,
			IsReversal: null,
			SettlementDate: null,
			Teller: null,
		};

		const { data } = await axios.post(`${Phedc.baseUrl}/NotifyPayment`, requestPayload);

		if (data[0].STATUS === "SUCCESS") {
			const details = filterDetails(data[0].DETAILS);
			return {
				ok: true,
				data: {
					meterNumber: data[0].METER_NO,
					receipt: data[0].RECEIPTNUMBER,
					date: data[0].PAYMENTDATETIME,
					amount: data[0].AMOUNT,
					token: data[0].TOKENDESC,
					units: data[0].UNITSACTUAL,
					tariff: data[0].TARIFF,
					accountType: requestData.accountTypes,
					transactionReference: requestData.transactionRef,
					...details,
				},
			};
		} else {
			return { ok: false, message: data[0] };
		}
	} catch (error: any) {
		console.error(`Error vending PHED for ${requestData.transactionRef}`);
		console.error(error);
		if (error.response) {
			console.error(error.response.data);
		} else {
			console.error(error);
		}
		return {
			ok: false,
			message: "Unable to complete transaction.",
		};
	}
}

export async function getWalletBalance(): Promise<Interface.getWalletBalanceResponse | Interface.ErrorResponse> {
	try {
		const requestPayload = {
			username: Phedc.userName,
			apikey: Phedc.apiKey,
		};

		const { data } = await axios.post(`${Phedc.baseUrl}/GetWalletBalance`, requestPayload);
		return {
			ok: true,
			data: {
				balance: data[0].BALANCE,
			},
		};
	} catch (error: any) {
		console.error("Error getting balance");
		if (error.response) {
			console.error("__________Error Response__________");
			console.error(error.response.data);
			console.error("__________Error Response__________");
		}
		console.error(error);

		return {
			ok: false,
			message: "Unable to retrieve wallet balance",
		};
	}
}

function filterDetails(
	details: Interface.Details[],
): Interface.genericReturn<
	Enums.phedcDetails.ARREARS | Enums.phedcDetails.ENERGY_VALUE | Enums.phedcDetails.PRELOAD | Enums.phedcDetails.VAT,
	string
> {
	const response = {
		"Arrears (NGN)": "0.00",
		"Energy Value (NGN)": "0.00",
		"Preload (NGN)": "0.00",
		"VAT (NGN)": "0.00",
	};
	const transctionDetails: Interface.Details[] = details;
	for (const iterator of transctionDetails) {
		response[iterator.HEAD] = iterator.AMOUNT;
	}

	return response;
}
