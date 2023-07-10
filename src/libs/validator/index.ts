/* eslint-disable @typescript-eslint/no-empty-interface */
import validator from "validator";
import { Validator, ArrayOptions } from "./interface";
import { App } from "@config";

const extraValidators = ["contains", "equals", "matches"];
const extraSanitizers = ["blacklist", "escape", "unescape", "normalizeEmail", "ltrim", "rtrim", "trim", "stripLow", "whitelist"];

const isSanitizer = (name: string) => name.startsWith("to") || extraSanitizers.includes(name);
const isValidator = (name: string) => name.startsWith("is") || extraValidators.includes(name);

type RuleType = "validator" | "sanitizer";
type ValidationFn = (...args: any[]) => boolean;
type SanitizerFn = (...args: any[]) => any;
interface ValidationRule {
	type: RuleType;
	fn: ValidationFn | SanitizerFn | string;
	args: any[];
	message?: string;
	negate: boolean;
}

export interface ValidationNode extends Validator {}
export class ValidationNode {
	#negate = false;
	#required = false;
	#rules: (ValidationRule | ValidationNode)[] = [];
	protected rule: Record<string, any>;
	constructor(public id: string, public parent?: ValidationNode) {
		this.rule = {
			id,
			required: false,
			validators: [],
			sanitizers: [],
		};
	}

	set message(_message: string) {
		return;
	}

	public child(id: string) {
		const child = new ValidationNode(id, this);
		this.rule.validators.push(child);
		this.rules.push(child);
		return child;
	}

	public endChild() {
		if (!this.parent) {
			App.ErrorHandler.handle(new Error("Validation Node is not a child"));
			throw new Error("Validation Node is not a child");
		}
		return this.parent;
	}

	public exists() {
		this.rule.required = true;
		this.#required = true;
		return this;
	}

	public get required() {
		return this.#required;
	}

	public get rules() {
		return this.#rules;
	}

	public get negate() {
		return this.#negate;
	}

	public set negate(negate: boolean) {
		this.#negate = negate;
	}

	public optional() {
		this.rule.required = false;
		this.#required = false;
		return this;
	}

	public isArray(options: ArrayOptions = {}) {
		return this.customValidator((value: any, obj: any) => {
			const { empty = true } = options;
			if (!Array.isArray(value)) {
				return false;
			}
			if (!empty) {
				return !!value.length;
			}
			return true;
		}).withMessage(`${this.id} must be an array`);
	}

	public equals(equals: any) {
		return this.customValidator((value: any, _obj: any, eq: any) => {
			return value === eq;
		}, equals);
	}

	public customValidator(fn: (...args: any[]) => any, ...args: any[]) {
		this.rule.validators.push({
			fn,
			args,
		});
		this.rules.push({
			type: "validator",
			fn,
			args,
			negate: this.#negate,
		});
		this.#negate = false;
		return this;
	}

	public customSanitizer(fn: (...args: any[]) => any, ...args: any[]) {
		this.rule.sanitizers.push({
			fn,
			args,
		});
		this.rules.push({
			type: "sanitizer",
			fn,
			args,
			negate: this.#negate,
		});
		this.#negate = false;
		return this;
	}

	public withMessage(message: string) {
		const len = this.rule.validators.length;
		if (!len || !this.rules.length) {
			return this;
		}
		this.rule.validators[len - 1].message = message;
		this.rules[len - 1].message = message;
		return this;
	}

	public not() {
		this.#negate = true;
		return this;
	}

	public end() {
		return this.rule;
	}
}

for (const key of Object.keys(validator)) {
	if (key !== "default" && typeof (validator as any)[key] === "function") {
		if (isSanitizer(key)) {
			(ValidationNode.prototype as any)[key] = function (this: ValidationNode, ...args: any[]) {
				this.rule.sanitizers.push({
					fn: key,
					args,
				});
				this.rules.push({
					type: "sanitizer",
					fn: key,
					args,
					negate: this.negate,
				});
				this.negate = false;
				return this;
			};
		} else if (isValidator(key)) {
			(ValidationNode as any).prototype[key] = function (this: ValidationNode, ...args: any[]) {
				this.rule.validators.push({
					fn: key,
					args,
				});
				this.rules.push({
					type: "validator",
					fn: key,
					args,
					negate: this.negate,
				});
				this.negate = false;
				return this;
			};
		}
	}
}

export class OneOf {
	public message: string;
	constructor(public nodes: (ValidationNode | ValidationNode[])[]) {
		this.message = "Invalid Value";
	}

	public withMessage(message: string) {
		this.message = message;
		return this;
	}

	public async validate(obj: any, options: any) {
		const nestedErrors: any[] = [];
		for (const oneof of this.nodes) {
			const nodes = Array.isArray(oneof) ? oneof : [oneof];
			const errors = await validate(obj, nodes, options);
			if (!errors.length) {
				return { passed: true, nestedErrors };
			}
			nestedErrors.push(errors);
		}
		return { passed: false, nestedErrors };
	}
}

export function node(id: string) {
	return new ValidationNode(id);
}

export function oneOf(nodes: (ValidationNode | ValidationNode[])[]) {
	return new OneOf(nodes);
}

export const validate2 = async (obj: Record<string, any>, nodes: any[] = [], options: any = {}) => {
	const { onlyFirst = true, parents = [] } = options;
	const errors: any = [];
	// tslint:disable-next-line: no-shadowed-variable
	for (let node of nodes) {
		let passed = true;
		if (node instanceof ValidationNode) {
			node = node.end();
		} else if (node instanceof OneOf) {
			const oneofvalidation = await node.validate(obj, options);
			passed = oneofvalidation.passed;
			if (!passed) {
				errors.push({
					message: node.message,
					nestedErrors: oneofvalidation.nestedErrors,
				});
			}
			continue;
		} else if (typeof node !== "object") {
			continue;
		}
		const { id: path, ...rule } = node;
		let elems = [];
		if (path === "*") {
			elems = Object.keys(obj);
		} else {
			elems.push(path);
		}
		for (const id of elems) {
			const paths = parents.slice();
			paths.push(id);
			const parameter = paths.join(".");
			if (rule.required && !obj[id]) {
				passed = false;
				errors.push({
					parameter,
					message: `${id} is required`,
				});
				if (onlyFirst) {
					continue;
				}
			}
			if (!rule.required && !obj[id]) {
				continue;
			}
			for (const validatorObj of rule.validators) {
				if (validatorObj instanceof ValidationNode) {
					const childOptions = JSON.parse(JSON.stringify(options));
					childOptions.parents = paths;
					errors.push(...(await validate(obj[id], [validatorObj], childOptions)));
					continue;
				}
				const { fn: predicate, args, message } = validatorObj;
				if (typeof predicate === "string") {
					if (["string", "number"].includes(typeof obj[id])) {
						if (!(validator as any)[predicate](String(obj[id]), ...args)) {
							passed = false;
							errors.push({
								parameter,
								message: message || "Invalid Value",
							});
							if (onlyFirst) {
								continue;
							}
						}
					} else {
						passed = false;
						errors.push({
							parameter,
							message: "Invalid type",
						});
					}
				} else if (predicate instanceof ValidationNode) {
					await validate(obj[id], [predicate], options);
				} else if (typeof predicate === "function") {
					if (!(await predicate(obj[id], obj, ...args))) {
						passed = false;
						errors.push({
							parameter,
							message: message || "Invalid Value",
						});
						if (onlyFirst) {
							continue;
						}
					}
				} else {
					App.ErrorHandler.handle(new Error("Unknown validator " + predicate));
					throw new Error("Unknown validator " + predicate);
				}
			}
			if (passed) {
				for (const { fn: sanitizer, args } of rule.sanitizers) {
					if (typeof sanitizer === "string") {
						obj[id] = (validator as any)[sanitizer](String(obj[id]), ...args);
					} else if (typeof sanitizer === "function") {
						obj[id] = await sanitizer(obj[id], obj, ...args);
					}
				}
			}
		}
	}
	return errors;
};

export const validate = async (obj: Record<string, any>, nodes: (ValidationNode | OneOf)[] = [], options: any = {}) => {
	const { onlyFirst = true, parents = [] } = options;
	const errors: any = [];
	// tslint:disable-next-line: no-shadowed-variable
	for (const node of nodes) {
		let passed = true;
		if (node instanceof OneOf) {
			const oneofvalidation = await node.validate(obj, options);
			passed = oneofvalidation.passed;
			if (!passed) {
				errors.push({
					message: node.message,
					nestedErrors: oneofvalidation.nestedErrors,
				});
			}
			continue;
		}
		const path = node.id;
		let elems = [];
		if (path === "*") {
			elems = Object.keys(obj);
		} else {
			elems.push(path);
		}
		for (const id of elems) {
			const paths = parents.slice();
			paths.push(id);
			const parameter = paths.join(".");
			if (node.required && obj[id] === undefined) {
				passed = false;
				errors.push({
					parameter,
					message: `${id} is required`,
				});
				if (onlyFirst) {
					continue;
				}
			}
			if (!node.required && !obj[id]) {
				continue;
			}
			for (const rule of node.rules) {
				if (rule instanceof ValidationNode) {
					const childOptions = JSON.parse(JSON.stringify(options));
					childOptions.parents = paths;
					errors.push(...(await validate(obj[id], [rule], childOptions)));
					continue;
				}
				const { fn: predicate, args, message = "Invalid value", type, negate } = rule;
				if (predicate instanceof ValidationNode) {
					errors.push(...(await validate(obj[id], [predicate], options)));
					continue;
				}
				if (type === "sanitizer") {
					obj[id] = await RunSanitizer(predicate, obj, id, args);
					continue;
				}
				if (typeof predicate === "string" && !["string", "number"].includes(typeof obj[id])) {
					errors.push({
						parameter,
						message: "Invalid type",
					});
				}
				const valid = await RunValidator(predicate, obj, id, args);
				if (!valid && !negate) {
					errors.push({
						parameter,
						message,
					});
				}
			}
		}
	}
	return errors;
};

const RunValidator = async (validationFn: string | ValidationFn, obj: any, id: string, args: any[]) => {
	if (typeof validationFn === "string") {
		return (validator as any)[validationFn](String(obj[id]), ...args) as boolean;
	}
	return (await validationFn(obj[id], obj, ...args)) as boolean;
};

const RunSanitizer = async (sanitizer: string | SanitizerFn, obj: any, id: string, args: any[]) => {
	if (typeof sanitizer === "string") {
		return (validator as any)[sanitizer](String(obj[id]), ...args);
	}
	return await sanitizer(obj[id], obj, ...args);
};
