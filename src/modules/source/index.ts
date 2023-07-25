import { Artifact } from "@components/artifact";
import { Source } from "@models/source";

export interface SourceObject {
	source: string;
	sourceId: string;
}

export interface SessionSourceObject extends SourceObject {
	sessionId: string;
}

export const createSource = async (name: string) => {
	const source = await Source.createSource(name);
	return new Artifact(source, "Source created Successfully");
};
