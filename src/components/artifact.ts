import { App } from "@config";
import { enumerable } from "@libs/decorators";
import { Activity } from "@models";
import ejs from "ejs";
import path from "path";

interface ArtifactActivity {
	key?: string;
	description: string;
	params?: any;
}
export class Artifact {
	public message: string | null = null;
	public data: object | null;

	@enumerable(false)
	public activity?: ArtifactActivity;
	private activityLogged = false;

	constructor(data: object | null = null, message?: string) {
		this.data = data;
		if (message) {
			this.message = message;
		}
	}

	public setAsActivity(activity: ArtifactActivity) {
		console.log("ACTIVITY IS HERE", activity);
		this.activity = activity;
		return this;
	}

	public andLogActivity({ source = null, sessionId = null, sourceId = null }: any) {
		if (!this.activityLogged && this.activity) {
			this.activityLogged = true;
			Activity.log({
				source,
				sessionId,
				key: this.activity.key,
				description: this.activity.description,
				params: this.activity.params || {},
				sourceId,
			});
		}
		return this;
	}
}

export interface Layout {
	name: string;
	params?: Record<string, any>;
	contentVar?: string;
}

export class Content {
	public static ext = ".ejs";
	public static viewPath: string = path.resolve(__dirname, "../../views");

	public static path(view: string) {
		if (view.endsWith("/")) {
			view += "index.ejs";
		}
		if (!view.startsWith("//") && view.startsWith("/")) {
			view = view.substring(1);
		}
		return path.resolve(this.viewPath, `${view}${view.endsWith(this.ext) ? "" : this.ext}`);
	}

	constructor(public view: string, public params: Record<string, any> = {}, public layout?: Layout) {}

	public async render() {
		const view = (this.constructor as any).path(this.view);
		if (!this.layout) {
			return await ejs.renderFile(view, this.params);
		}
		const layoutFile = (this.constructor as any).path(`layouts/${this.layout.name}`);
		const content = this.layout.contentVar || "content";
		if (!this.layout.params) {
			this.layout.params = {};
		}
		this.params.layout = this.layout.params;
		this.params.layout[content] = view;
		return ejs.renderFile(layoutFile, this.params, {
			debug: false,
		});
	}
}

interface Renderer {
	status(code: number): this;
	send(data: any): any;
}

interface Message {
	code: number;
	title: string;
	message: string;
	type?: "info" | "warn" | "success";
	link?: string;
	button?: string;
	layout?: {
		title?: string;
		[key: string]: any;
	};
	[key: string]: any;
}

export const showMessage = (renderer: Renderer, { code = 200, layout, ...params }: Message) => {
	if (!params.button) {
		params.button = "Go Home";
	}
	if (!params.link) {
		params.link = App.BASE_URL;
	}
	return new Content("message/new", params, {
		name: "message",
		params: layout || {},
	})
		.render()
		.then((content) => {
			renderer.status(code).send(content);
		});
};
