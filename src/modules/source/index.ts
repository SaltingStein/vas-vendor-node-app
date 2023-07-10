export interface SourceObject {
	source: string;
	sourceId: string;
}

export interface SessionSourceObject extends SourceObject {
	sessionId: string;
}
