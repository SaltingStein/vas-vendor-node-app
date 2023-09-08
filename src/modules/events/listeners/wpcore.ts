import { Logger } from "@weaverkit/logger";
import { Event, EventType, ListenerSandbox } from "@modules/events/emitter";
import { App } from "@config";
import Redis from "@connections/redis";
import WPCore from "@libs/WPCore";
import { IPayment, DocumentType } from "@models";

export interface MerchantProfileEvent {
	id: string;
}

Event.on(
	EventType.MERCHANT_PROFILE_UPDATE,
	ListenerSandbox(async (event: MerchantProfileEvent) => {
		const agentId = event.id;
		const cached = await Redis.ActiveConnection.get(`${agentId}`);
		if (cached) {
			const { ok, data } = await WPCore.getProfile({ authToken: App.ADMIN_TOKEN, user: { user_id: agentId } });
			if (!ok && "message" in data) {
				Logger.error("Error retrieving agent's profile", data);
				return;
			} else {
				const parsedData = JSON.parse(cached);
				Object.assign(data, { id: parsedData.id, msisdn: parsedData.msisdn });
				await Redis.ActiveConnection.set(`${agentId}`, JSON.stringify(data));
				Logger.info(`Agent profile update successful------Agent ID: ${agentId}`);
				return;
			}
		} else {
			Logger.info(`Agent profile not found in cache------Agent ID: ${agentId}`);
		}
	}),
);
