import { Logger } from "@components/logger";

export enum EventType {
	MERCHANT_PROFILE_UPDATE = "merchant:profile:update",
}

export const ListenerSandbox = (listener: (...args: any[]) => void) => {
	return (...params: any[]) => {
		setImmediate(async () => {
			try {
				await listener(...params);
			} catch (error) {
				Logger.error("Event Listener Error: ", error);
			}
		});
	};
};
