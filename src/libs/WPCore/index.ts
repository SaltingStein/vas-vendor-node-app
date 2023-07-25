import { InvalidArgumentError, ErrorType } from "@components/errors";
import { WP_CORE as WPCoreConfig } from "@config";
import * as Interface from "./interfaces";
import * as Enum from "./enums";
import axios from "axios";

class WPCore implements Interface.UserProfile {
	public async getProfile(
		requestData: Interface.GetUserProfileRequestData,
	): Promise<Interface.ErrorResponse | Interface.GetUserProfileResponse> {
		try {
			const payload = {
				action: Enum.Actions.PROFILE,
				agentId: requestData.mobileNumber,
			};
			const wpHeader = { Authorization: `Bearer ${requestData.authToken}` };
			const { data } = await axios.post(`${WPCoreConfig.url}/agent-discount`, payload, {
				headers: wpHeader,
			});
			console.log("USER PROFILE REPONSE DATA", data);
			if (data.code === 200) {
				return {
					ok: true,
					data: data.body,
				};
			} else {
				return {
					ok: false,
					data: {
						type: ErrorType.SERVICEUNAVAILABLE,
						message: `Unable to retrieve merchant profile. Please try again`,
					},
				};
			}
		} catch (error: any) {
			console.error(`Error retrieving merchant profile. Please try again`, error);
			if (error.response) {
				console.error(error.response.data);
			} else {
				console.error(error);
			}
			return {
				ok: false,
				data: {
					type: ErrorType.SERVICEUNAVAILABLE,
					message: `Error retrieving merchant profile. Please try again`,
				},
			};
		}
	}
}

export default new WPCore();
