import { ErrorResponse, Response } from "@components/interfaces";
export { ErrorResponse } from "@components/interfaces";

export interface UserProfile {
	getProfile(data: GetUserProfileRequestData): Promise<GetUserProfileResponse | ErrorResponse>;
}

export interface GetUserProfileRequestData {
	authToken: string;
	mobileNumber: string;
}

export interface GetUserProfileResponse extends Response {
	data: {
		msisdn: string;
		wallet_balance: string;
		commissions: {
			[x: string]: {
				[y: string]: {
					discount: string;
					custormerreward: string;
					rewardthreshold: string;
				};
			};
		};
		is_banned: string;
	};
}
