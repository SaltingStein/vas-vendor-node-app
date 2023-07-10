import { InvalidActionError, InvalidArgumentError, ValidationError } from "@components/errors";
import { App } from "@config";
import Redis from "@connections/redis";
import { interpolator } from "@libs/utils";
import { validate as validatorRoot, ValidationNode } from "@libs/validator";

export * from "@libs/decorators";

const composeLogger = (logger?: any, name?: string) => {
	return function log(message: string) {
		if (logger && typeof logger === "function") {
			if (name) {
				message = `Log from ${name} ==> ${message}`;
			}
			logger(message);
		}
	};
};

interface ICacheOptions {
	key?: string;
	expiry?: number;
	logger?: any;
}
interface ICacheData {
	value: any;
}
// @todo - allow cache key template to span all argument indices apart from zero
export const cache = (options: ICacheOptions = {}) => {
	return (target: any, property: string, descriptor: PropertyDescriptor) => {
		const method = descriptor.value;
		descriptor.value = async function (...args: any[]) {
			const logger = composeLogger(options.logger, "cache");
			// tslint:disable-next-line: max-line-length
			const redisKey = `cache:${target.constructor.name}:${options.key ? interpolator.parse(options.key, args[0]) : property}`;
			logger(`Redis Key - ${redisKey}`);
			const cached = await Redis.ActiveConnection.get(redisKey);
			console.log(`REDIS VALUE`, cached);
			if (cached) {
				// try to parse cached data
				try {
					const cachedObj: ICacheData = JSON.parse(cached);
					// return cached data
					if (cachedObj.value) {
						logger(`Cache hit for ${redisKey}`);
						return cachedObj.value;
					}
				} catch (error) {
					logger(`Cached data for ${redisKey} is possibly corrupted -  ${JSON.stringify(error)}`);
				}
			}
			// cached data not found, call method
			logger(`Cache miss for ${redisKey}...calling method`);
			const result: ICacheData = {
				value: await method.apply(this, args),
			};
			try {
				await Redis.ActiveConnection.set(redisKey, JSON.stringify(result), [
					"EX",
					options.expiry || Number(App.DEFAULT_CACHE_PERIOD),
				]);
			} catch (error) {
				logger(`Attempt to cache data for ${redisKey} failed`);
			}
			return result.value;
		};
	};
};

export const singleArgAssert = (...keys: string[]) => {
	return (target: any, property: string, descriptor: PropertyDescriptor) => {
		const method = descriptor.value;
		descriptor.value = async function (...args: any[]) {
			const singleArg = args[0];
			const invalid = [];
			for (const key of keys) {
				if (!singleArg[key]) {
					invalid.push(key);
				}
			}
			if (invalid.length > 0) {
				// tslint:disable-next-line: max-line-length
				App.ErrorHandler.handle(
					new InvalidArgumentError(
						`Required parameters [${invalid.join(", ")}] are missing. Check documentation for properly invoking ${
							target.constructor.name
						}.${property}`,
					),
				);
				throw new InvalidArgumentError(
					`Required parameters [${invalid.join(", ")}] are missing. Check documentation for properly invoking ${
						target.constructor.name
					}.${property}`,
				);
			}
			return await method.apply(this, args);
		};
	};
};

interface ValidateDecorOpts {
	index?: number;
}

export const validate = (constraints: ValidationNode[], { index = 0 }: ValidateDecorOpts = {}) => {
	return (target: any, property: string, descriptor: PropertyDescriptor) => {
		const method = descriptor.value;
		descriptor.value = async function (...args: any[]) {
			const errors = await validatorRoot(args[index], constraints);
			if (errors.length > 0) {
				// tslint:disable-next-line: max-line-length
				if (errors.length > 0) {
					App.ErrorHandler.handle(new ValidationError().setData({ validation_failed: true, errors }));
					throw new ValidationError().setData({ validation_failed: true, errors });
				}
			}
			return await method.apply(this, args);
		};
	};
};

export const requiresPayment = () => {
	return (target: any, property: string, descriptor: PropertyDescriptor) => {
		const method = descriptor.value;
		descriptor.value = async function (...args: any[]) {
			if (!(this as any).payment) {
				App.ErrorHandler.handle(new InvalidActionError(`Payment is required to use ${target.constructor.name} ${property}`));
				throw new InvalidActionError(`Payment is required to use ${target.constructor.name} ${property}`);
			}
			return await method.apply(this, args);
		};
	};
};

// interface NotifySourceOptions {
// 	template: string;
// 	priority: MessagePriority;
// 	when?: (params: any) => boolean | Promise<boolean>;
// }

// export const notifySource = (options: NotifySourceOptions) => {
// 	return (target: any, property: string, descriptor: PropertyDescriptor) => {
// 		const method = descriptor.value;
// 		descriptor.value = async function (this: BaseOfferingHandler, ...args: any[]) {
// 			const artifact = await method.apply(this, args);
// 			const params = {
// 				user: this.user,
// 				source: this.source,
// 				params: this.params,
// 				offering: this.offering,
// 				artifact,
// 			};
// 			if (options.when && (await options.when(params)) === false) {
// 				return artifact;
// 			}
// 			const action = new Promise((resolve, reject) => {
// 				try {
// 					const text = ejs.render(options.template, params);
// 					return SourceHandler.notify(this.source!, { text, priority: options.priority });
// 				} catch (error: any) {
// 					Logger.error(error);
// 					reject(error);
// 				}
// 			});
// 			action.then(noop).catch(noop);
// 			return artifact;
// 		};
// 	};
// };
