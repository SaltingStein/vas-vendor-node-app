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

export interface FetchOrderResponse extends Response {
	message: string;
	data: {
		transactionRef: string;
		status: string;
		description: string;
		initiator: number;
		createdAt: string;
		transactionParams: {
			meterNumber: number;
			providerCode: string;
			serviceCode: string;
			amount: number;
			numberRef: number;
		};
	};
}
