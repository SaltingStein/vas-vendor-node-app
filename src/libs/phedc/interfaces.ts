import * as Enum from "./enums";

export interface VerifyMeterNoRequestData {
	meterNo: string;
	serviceCode: string;
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
		meterNo: string;
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

export interface Details {
	HEAD: Enum.phedcDetails.ARREARS | Enum.phedcDetails.ENERGY_VALUE | Enum.phedcDetails.PRELOAD | Enum.phedcDetails.VAT;
	AMOUNT: string;
}

export interface ErrorResponse extends Response {
	message: string;
}
