// import { CashtokenBundles, BundleSchema } from "";
import { App } from "@config";
import { NotFoundError, BadRequestError } from "@components/errors";
import { Event, EventType } from "@modules/events";
import { Logger } from "@components/logger";

export type Actions = "profile";

enum actions {
	"profile" = "PROFILE",
}

export interface Params {
	id?: string;
	action: Actions;
}

export enum CallbackTypes {
	"WPCORE" = "wpcore",
}

class CallbackSource {
	public async wpcore(params: Params) {
		const { id, action } = params;
		if (!actions[action]) {
			App.ErrorHandler.handle(new NotFoundError(`No Callback handler for ${action}`));
			throw new NotFoundError(`Resource not found`);
		}
		if (actions[action].toUpperCase() === actions.profile) {
			if (!id) {
				Logger.error("Agent ID not provided", { Action: actions[action] });
				throw new BadRequestError("Agent ID is required");
			}
			Event.emit(EventType.MERCHANT_PROFILE_UPDATE, { id });
			return null;
		}
	}
}

export const callbackSources = new CallbackSource();
