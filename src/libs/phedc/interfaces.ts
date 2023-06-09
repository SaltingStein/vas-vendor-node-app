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

export interface ErrorResponse extends Response {
	message: string;
}
