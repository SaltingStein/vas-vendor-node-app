import * as Enum from "./enums";

export interface VerifyMeterNoRequestData {
	meterNumber: string;
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

interface Response {
	ok: boolean;
}

export interface VerifyMeterNoResponse extends Response {
	data: {
		name: string;
		address: string;
		tarriffIndex: string;
		arrear: string;
	};
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
		"Arrears (NGN)": string;
		"Energy Value (NGN)": string;
		"Preload (NGN)": string;
		"VAT (NGN)": string;
	};
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
		transactionReference: string;
		"Arrears (NGN)": string;
		"Energy Value (NGN)": string;
		"Preload (NGN)": string;
		"VAT (NGN)": string;
	};
}

export interface Details {
	HEAD: Enum.phedcDetails.ARREARS | Enum.phedcDetails.ENERGY_VALUE | Enum.phedcDetails.PRELOAD | Enum.phedcDetails.VAT;
	AMOUNT: string;
}

export interface ErrorResponse extends Response {
	message: string;
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
