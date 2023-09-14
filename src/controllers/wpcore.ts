import { Artifact } from "@components/artifact";
import { callbackSources, Params, CallbackTypes } from "../modules/callbacks";

export const callback = async (payload: Params) => {
	return new Artifact(
		await callbackSources[CallbackTypes.WPCORE as keyof typeof callbackSources](payload),
		"Callback recieved successfully",
	);
};
