import * as Enum from "./enums";
import { Response } from "@components/interfaces";
export { ErrorResponse } from "@components/interfaces";

export interface VerifyMeterNoRequestData {
	meterNumber: string;
	disco: string;
	serviceCode: string;
}

export interface VendElectrictyRequestData {
	meterNumber: string;
	amount: string;
	transactionRef: string;
	customerName: string;
	tarriffIndex: string;
	address: string;
	accountTypes: string;
}

export interface VerifyMeterNoResponse extends Response {
	data: {
		name: string;
		address: string;
		tarriffIndex: string;
		arrear: string;
		disco: string;
	};
}
export interface getWalletBalanceResponse extends Response {
	data: {
		balance: string;
	};
}

export interface detailsProperties {
	"Arrears (NGN)": string;
	"Energy Value (NGN)": string;
	"Preload (NGN)": string;
	"VAT (NGN)": string;
}

export interface RequeryVendResponse extends Response {
	data: {
		meterNumber: string;
		receipt: string;
		tarriffIndex: string;
		date: string;
		amount: string;
		status: string;
		units: string;
		tarriff: string;
	} & detailsProperties;
}

export interface VendElectricityResponse extends Response {
	data: {
		token: string;
		receipt: string;
		meterNumber: string;
		amount: string;
		date: string;
		units: string;
		tariff: string;
		accountType: string;
	} & detailsProperties;
}

export interface Details {
	HEAD: Enum.phedcDetails.ARREARS | Enum.phedcDetails.ENERGY_VALUE | Enum.phedcDetails.PRELOAD | Enum.phedcDetails.VAT;
	AMOUNT: string;
}

export type genericReturn<
	T extends
		| string
		| number
		| symbol
		| Enum.phedcDetails.ARREARS
		| Enum.phedcDetails.ENERGY_VALUE
		| Enum.phedcDetails.PRELOAD
		| Enum.phedcDetails.VAT,
	C extends string | number | symbol,
> = {
	[x in T]: C;
};
