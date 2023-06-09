export interface IObjectData {
	[key: string]: any;
}

export interface VendAirtimeRequestData {
	recipient: string;
	amount: number;
	network: string;
	merchantId: string;
	transactionRef: string;
}

export interface VendElectrictyRequestData {
	meterNumber: string;
	disco: string;
	serviceCode: string;
	amount: string;
	merchantId: string;
	transactionRef: string;
}

export interface VerifySmartCardNoRequestData {
	cardNo: string;
	providerCode: string;
	bouquetCode: string;
}
export interface VerifyMeterNoRequestData {
	meterNo: string;
	disco: string;
	serviceCode: string;
}

export interface VendCableTVRequestData {
	smartcardNo: string;
	bouquetCode: number;
	providerCode: number;
	merchantId: string;
	transactionRef: string;
}

export interface GetBouquetAmountRequestData {
	bouquetCode: string;
	provider: string;
}

interface Response {
	ok: boolean;
}

export interface VendAirtimeResponse extends Response {
	data: {
		receipt: string;
		amount: string;
		recipient: string;
		network: string;
		date: string;
		transactionReference: string;
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
		additionalToken: string;
		accountType: string;
		transactionReference: string;
	};
}

export interface VendCableTVResponse extends Response {
	data: {
		provider: string;
		packageName: string;
		smartCardNo: string;
		amount: string;
		receipt: string;
		date: string;
	};
}

export interface VerifySmartCardNoResponse extends Response {
	data: {
		customer: string;
		customerNumber: string;
		type: string;
	};
}
export interface VerifyMeterNoResponse extends Response {
	data: {
		name: string;
		address: string;
		disco: string;
		phoneNumber: string;
		tarriffIndex: string;
		minimumAmount: string;
	};
}
export interface GetElectricityProvidersResponse extends Response {
	data: {
		code: string;
		title: string;
		serviceCodes: {
			code: string;
			title: string;
		}[];
	}[];
}

export interface GetBouquetAmountResponse extends Response {
	data: {
		price: string;
		name: string;
	};
}

export interface GetProviderPropertyResponse extends Response {
	data: {
		[x: string]: string;
	};
}

export interface ErrorResponse extends Response {
	message: string;
}

export interface AirtimeProviderResponse<T> extends Response {
	data: T[];
}

export interface CableTVProviderResponse extends Response {
	data: { [x: string]: string }[];
}

export interface VendDatabundleRequestData {
	recipient: string;
	bundleCode: string;
	network: string;
	merchantId: string;
	transactionRef: string;
}

export interface VendDatabundleResponse extends Response {
	data: {
		receipt: string;
		amount: string;
		recipient: string;
		network: string;
		date: string;
		transactionReference: string;
	};
}

export interface DatabundleProviderResponse<T> extends Response {
	data: T[];
}

// export interface FetchDatabundleRequestData {
// 	provider: string;
// }

export interface FetchDatabundleResponse extends Response {
	data: {
		provider: string;
		dataBundles: {
			code: string;
			title: string;
			price: number;
		}[];
	};
}

export interface GetDatabundleAmountRequestData {
	bundleCode: string;
	provider: string;
}

export interface GetDatabundleAmountResponse extends Response {
	data: {
		price: number;
		name: string;
	};
}

// "code": "DATA-15",
// "providerId": "MTN",
// "title": "400GB - 365days",
// "price": 120000

// export interface IResponseBody<T = any> {
// 	status: string;
// 	responseCode: string;
// 	message: string;
// 	data: T | null;
// }

// export interface TransactionReference {
// 	transaction_reference: string;
// }

// export interface WalletBalanceRequestData {
// 	balance: number;
// 	account: string;
// }

// export interface BusinessProfileRequestData {
// 	balance: number;
// 	mode: string;
// 	business: {
// 		business_id: string | number;
// 		name: string;
// 		public_key_live: string;
// 		secret_key_live: string;
// 		public_key_test: string;
// 		secret_key_test: string;
// 	};
// }

// export interface BasicCustomer {
// 	customer_meter_number: string;
// 	customer_phone: string;
// 	customer_email: string;
// }

// export interface CustomerValidationPayload extends IObjectData, BasicCustomer {
// 	account_type: string;
// }

// export interface CustomerValidationResponseData extends IObjectData {
// 	name: string;
// 	address: string;
// 	email: string;
// 	arrear: string;
// 	metre_no: string;
// 	bsc_name: string;
// 	ibc_name: string;
// 	cons_type: string;
// 	current_amount: number;
// 	number: string;
// 	phone: string | null;
// 	business_id: string | number;
// 	tarrif_code: string;
// 	total_bill: string;
// }

// export interface PurchasePowerPayload extends IObjectData, BasicCustomer, TransactionReference {
// 	customer_name: string;
// 	customer_number: string;
// 	amount: string;
// }

// export interface PurchasePowerResponseData extends IObjectData, TransactionReference {
// 	customer_no: string;
// 	meter_no: string;
// 	receipt_no: string;
// 	payment_datetime: string;
// 	amount: string;
// 	token: string;
// 	energy_units: string;
// }

// export interface TransactionHistory {
// 	customer_no: string;
// 	meter_no: string;
// 	receipt_number: string;
// 	payment_date_time: string;
// 	units_actual: string;
// 	tarrif: string;
// 	energy_value: string;
// 	energy_value_amount: string;
// 	token: string;
// 	transaction_reference: string;
// 	status: string;
// }

// export interface TransactionHistoryResponseData extends IObjectData {
// 	rows: TransactionHistory[];
// 	meta: {
// 		limit: number;
// 		current_page: number;
// 		total: number;
// 	};
// }
