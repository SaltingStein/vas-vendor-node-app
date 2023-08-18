import { ErrorResponse, Response } from "@components/interfaces";
export { ErrorResponse } from "@components/interfaces";

export interface UserProfile {
	getProfile(data: GetUserProfileRequestData): Promise<GetUserProfileResponse | ErrorResponse>;
}

export interface BundlePriceListing {
	getBundlePriceListing(): Promise<GetBundlePriceListingResponse | ErrorResponse>;
}

export interface GetBundlePriceListingResponse extends Response {
	data: {
		[x: string]: {
			[y: string]: {
				utility: string;
				cashToken: string;
			};
		};
	};
}

export interface GetUserProfileRequestData {
	authToken: string;
	user: any;
}

export interface Data {
	id: string;
	msisdn: string;
	wallet_balance: string;
	commissions: {
		[x: string]: {
			[y: string]: {
				discount: string;
				custormerreward: string;
				rewardthreshold: string;
				referrar: string;
			};
		};
	};
	is_banned: string;
	token?: string;
}

export interface GetUserProfileResponse extends Response {
	data: Data;
}
