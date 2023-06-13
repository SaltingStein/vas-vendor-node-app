declare module "cachegoose" {
	interface ICachegooseOptions {
		engine?: any;
	}
	function init(mongoose: any, options: ICachegooseOptions): void;
	export default init;
	export function clearCache(key: string | null, cb: () => void): void;
}

declare module "cacheman-redis" {
	class RedisStore {
		constructor(options?: { client?: any });
	}
	export = RedisStore;
}
