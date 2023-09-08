import * as FelaInterface from "@libs/fela/interfaces";
import * as PhedcInterface from "@libs/phedc/interfaces";
import { ErrorType } from "@components/errors";

export interface AirtimeProvider {
	vend(data: FelaInterface.VendAirtimeRequestData): Promise<FelaInterface.ErrorResponse | FelaInterface.VendAirtimeResponse>;
}

export interface CashtokenBundleProvider {
	vendCashtokenBundle(data: any): any;
}

export interface DataProvider {
	getDatabundles(providerId: string): Promise<FelaInterface.FetchDatabundleResponse | FelaInterface.ErrorResponse>;
	vend(data: FelaInterface.VendDatabundleRequestData): Promise<FelaInterface.VendDatabundleResponse | FelaInterface.ErrorResponse>;
	getBundleAmount(
		bundle: FelaInterface.GetDatabundleAmountRequestData,
	): Promise<FelaInterface.GetDatabundleAmountResponse | FelaInterface.ErrorResponse>;
}

export interface ElectricityProvider {
	vend(
		requestData: FelaInterface.VendElectrictyRequestData | PhedcInterface.VendElectrictyRequestData,
	): Promise<FelaInterface.ErrorResponse | FelaInterface.VendElectricityResponse | PhedcInterface.VendElectricityResponse>;
	fetchElectricityProviders(): Promise<FelaInterface.GetElectricityProvidersResponse | FelaInterface.ErrorResponse>;
	verifyMeter(
		requestData: FelaInterface.VerifyMeterNoRequestData | PhedcInterface.VerifyMeterNoRequestData,
	): Promise<FelaInterface.VerifyMeterNoResponse | FelaInterface.ErrorResponse | PhedcInterface.VerifyMeterNoResponse>;
	requeryOrder(transactionId: string): Promise<PhedcInterface.RequeryVendResponse | FelaInterface.ErrorResponse>;
	getWalletBalance(): Promise<PhedcInterface.GetWalletBalanceResponse | PhedcInterface.ErrorResponse>;
}

export interface CableTvProvider {
	vend(requestData: FelaInterface.VendCableTVRequestData): Promise<FelaInterface.ErrorResponse | FelaInterface.VendCableTVResponse>;
	fetchCabletvProviders(): Promise<FelaInterface.ErrorResponse | FelaInterface.CableTVProviderResponse>;
	fetchBouquets(provider: string): Promise<FelaInterface.ErrorResponse | FelaInterface.CableTVProviderResponse>;
	getBouquetAmount(
		requestData: FelaInterface.GetBouquetAmountRequestData,
	): Promise<FelaInterface.ErrorResponse | FelaInterface.GetBouquetAmountResponse>;
	getProviderName(providerCode: string): Promise<FelaInterface.GetProviderPropertyResponse | FelaInterface.ErrorResponse>;
	getProviderCode(providerName: string): Promise<FelaInterface.GetProviderPropertyResponse | FelaInterface.ErrorResponse>;
	verifySmartCardNo(
		requestData: FelaInterface.VerifySmartCardNoRequestData,
	): Promise<FelaInterface.VerifySmartCardNoResponse | FelaInterface.ErrorResponse>;
}

export interface Services {
	services: {
		[x: string]: string[];
	};
}
export interface Response {
	ok: boolean;
}

export interface ErrorResponse extends Response {
	data: {
		type: ErrorType;
		message: string;
		details?: object;
	};
}
