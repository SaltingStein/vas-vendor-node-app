import { App, Redis as RedisConfig } from "@config";
import { createHandyClient, IHandyRedis } from "handy-redis";
import { ClientOpts } from "redis";
import { BaseConnection } from "./base";

export enum PREFIX {
	NULL = "",
	OAUTH = "oauth",
	USER_RESET = "user:reset",
	USER_INVITE = "user:invite",
}

export const makeKey = (key: string, prefix: PREFIX | string = PREFIX.NULL) => {
	return prefix === "" || prefix.endsWith(":") ? ((prefix as string) += key) : ((prefix as string) += `:${key}`);
};

class RedisConnection extends BaseConnection<IHandyRedis, ClientOpts> {
	constructor(options?: ClientOpts | undefined) {
		super(options);
	}
	public createConnection() {
		let defaults: ClientOpts = {
			prefix: `${App.NAME}:${App.ENV}:`,
			db: 2,
		};
		if (this.options) {
			defaults = { ...defaults, ...this.options };
		}
		return createHandyClient(defaults);
	}

	public set connectionOptions(v: ClientOpts) {
		this.options = v;
	}
}

const Redis = new RedisConnection({
	host: RedisConfig.host,
	port: RedisConfig.port,
	// tls: RedisConfig.tls,
	// password: RedisConfig.password,
});
type HashEntry = [string, string];
type RedisAccessor = [string, (PREFIX | string)?];

export interface RedisHash<T = Record<string, any>> {
	get<R = any>(id: keyof T): R;
}

export interface RedisHashSaveOptions {
	expire?: number;
}
export class RedisHash<T = Record<string, any>> extends Map<keyof T, any> {
	public static get(key: string, field: string) {
		return Redis.ActiveConnection.hget(key, field);
	}

	public static clear(key: string) {
		return Redis.ActiveConnection.del(key);
	}

	public static find<T = Record<string, any>>(key: string) {
		return Redis.ActiveConnection.hgetall(key).then((hash: Record<string, string>) => {
			if (!hash) {
				return null;
			}
			const unwrapped = Object.entries(hash).map((entry) => {
				entry[1] = unserialize(entry[1]);
				return entry;
			});
			return new RedisHash<T>(key, unwrapped as any);
		});
	}

	// tslint:disable-next-line: variable-name
	private __key: string;

	constructor(key: string, entries?: Record<keyof T, any> | [keyof T, any][]) {
		if (Array.isArray(entries) || entries === undefined) {
			super(entries);
		} else if (typeof entries === "object") {
			super(Object.entries(entries) as any);
		} else {
			App.ErrorHandler.handle(new Error("Unknown Hash construction"));
			throw new Error("Unknown Hash construction");
		}
		this.__key = key;
	}

	public getKey() {
		return this.__key;
	}

	public async save(options: RedisHashSaveOptions = {}) {
		const entries = [...this].map((entry) => {
			entry[1] = serialize(entry[1]);
			return entry as HashEntry;
		});
		const saved = await Redis.ActiveConnection.hmset(this.getKey(), ...entries);
		if (saved && options.expire) {
			await Redis.ActiveConnection.expire(this.getKey(), options.expire);
		}
		return saved;
	}

	public toObject() {
		return [...this].reduce((obj: any, entry) => {
			obj[entry[0]] = entry[1];
			return obj;
		}, {}) as T;
	}
}

const serialize = (data: string | any[] | unknown) => {
	if (typeof data === "string" || typeof data === "number") {
		return String(data);
	} else if (Array.isArray(data) || typeof data === "object") {
		return JSON.stringify(data);
	} else {
		App.ErrorHandler.handle(new Error("Failed to serialize data with unsupported type " + typeof data));
		throw new Error("Failed to serialize data with unsupported type " + typeof data);
	}
};

const unserialize = (data: string) => {
	try {
		return isNaN(Number(data)) ? JSON.parse(data) : data;
	} catch (error) {
		return data;
	}
};

export class KeyVal {
	public static async get([key, prefix = PREFIX.NULL]: RedisAccessor) {
		const data = await Redis.ActiveConnection.get(makeKey(key, prefix));
		return data ? unserialize(data) : data;
	}

	public static delete([key, prefix = PREFIX.NULL]: RedisAccessor) {
		return Redis.ActiveConnection.del(makeKey(key, prefix));
	}

	public static async set(
		[key, prefix = PREFIX.NULL]: RedisAccessor,
		value: string | any[] | unknown,
		ttl?: ["EX" | "PX", number] | null,
		condition?: "NX" | "XX",
	) {
		try {
			let set = null;
			const accessor = makeKey(key, prefix);
			const val = serialize(value);
			if (ttl && condition) {
				set = await Redis.ActiveConnection.set(accessor, val, ttl as any, condition);
			} else if (ttl) {
				set = await Redis.ActiveConnection.set(accessor, val, ttl as any);
			} else if (condition) {
				set = await Redis.ActiveConnection.set(accessor, val, condition);
			} else {
				set = await Redis.ActiveConnection.set(accessor, val);
			}
			if (set) {
				return true;
			}
			return false;
		} catch (error) {
			return false;
		}
	}
}

export default Redis;
