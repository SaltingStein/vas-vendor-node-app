import startCase = require("lodash.startcase");
import { ModelPopulateOptions, Types, model } from "mongoose";
import { ClassType, Field, InputType, ObjectType, registerEnumType } from "type-graphql";

export { DocumentType, ReturnModelType } from "@typegoose/typegoose";
import { DocumentType, ReturnModelType } from "@typegoose/typegoose";

import { App } from "@config";

export type InstanceType<T> = DocumentType<T>;

@ObjectType()
class Pager {
	@Field()
	public totalItems!: number;

	@Field()
	public size!: number;

	@Field()
	public count!: number;

	@Field({ nullable: true })
	public previous!: number;

	@Field()
	public current!: number;

	@Field({ nullable: true })
	public next!: number;

	@Field()
	public index!: number;
}

@InputType()
export class PageInput {
	@Field({ defaultValue: 20 })
	public limit!: number;

	@Field({ defaultValue: 1 })
	public page!: number;
}

export function composePaginatedModel<T = any>(dataType: ClassType<T>, name?: string) {
	const typeName = name || `${dataType.name}PaginatedModel`;
	@ObjectType(typeName)
	class PaginatedModel {
		@Field((returns) => [dataType], { defaultValue: [] })
		public items: T[] = [];

		@Field()
		public pager!: Pager;
	}
	return PaginatedModel;
}

export enum FilterOperator {
	GT = "$gt",
	LT = "$lt",
	GTE = "$gte",
	LTE = "$lte",
	EQ = "$eq",
}

registerEnumType(FilterOperator, {
	name: "FilterOperator",
});
const filterClasses: any = {};
export function getFilterClass(Type: any) {
	const name = Type.name;
	if (filterClasses[name]) {
		return filterClasses[name];
	}
	@InputType(`${name}Filter`)
	class Filter {
		@Field((type) => FilterOperator)
		public op!: FilterOperator;

		@Field((type) => Type)
		public value!: any;
	}
	filterClasses[name] = Filter;
	return Filter;
}

interface FilterOptions {
	type?: any;
	description?: string;
}

const filterStore: any = {};
export const filterable = ({ type, description }: FilterOptions = {}) => {
	return (target: any, propertyKey: string) => {
		const Type = type || Reflect.getMetadata("design:type", target, propertyKey);
		// if (!["Number", "String", "Date", "Boolean"].includes(Type.name)) {
		// 	App.ErrorHandler.handle(new Error("Only strings or number or boolean or date types are allowed"));
		// 	throw new Error("Only strings or number or boolean or date types are allowed");
		// }
		const name = target.constructor.name;
		if (!filterStore[name]) {
			filterStore[name] = {};
		}
		filterStore[name][propertyKey] = {
			type: Type,
			description,
		};
	};
};

export const getFilters = (target: any, prefix = "") => {
	const name = target.name + prefix;
	if (!filterStore[name]) {
		return null;
	}
	const filters: Record<string, any> = filterStore[name];
	@InputType(`${name}Filter`)
	class Filter {}
	const entries = Object.entries(filters);
	for (const [key, filter] of entries) {
		const FilterClass = getFilterClass(filter.type);
		Field((type) => [FilterClass], { nullable: true, description: filter.description || undefined })(Filter.prototype, key);
	}
	for (const [key] of entries) {
		(Filter as any).prototype[key] = undefined;
	}
	return Filter;
};

export enum SortDirection {
	ASC = 1,
	DESC = -1,
}

registerEnumType(SortDirection, {
	name: "SortDirection",
});

const sortStore: any = {};
export const sortable = () => {
	return (target: any, propertyKey: string) => {
		const Type = Reflect.getMetadata("design:type", target, propertyKey);
		const name = target.constructor.name;
		if (!sortStore[name]) {
			sortStore[name] = {};
		}
		sortStore[name][propertyKey] = {
			type: Type,
		};
	};
};

interface EditableOptions {
	nest?: boolean;
	type?: any;
	required?: boolean;
}

const inputStore: any = {};
export const editable = ({ nest = false, required = true, type }: EditableOptions = {}) => {
	return (target: any, propertyKey: string) => {
		const Type = type || Reflect.getMetadata("design:type", target, propertyKey);
		const name = target.constructor.name;
		if (!inputStore[name]) {
			inputStore[name] = {};
		}
		inputStore[name][propertyKey] = {
			type: Type,
			nest,
			required,
		};
	};
};

export type InputMode = "create" | "update";
const inputClasses: any = {
	create: {},
	update: {},
};
export const getInput = (target: any, mode: InputMode = "create") => {
	const name = target.name;
	if (!inputStore[name]) {
		return null;
	}
	if (inputClasses[mode][name]) {
		return inputClasses[mode][name];
	}
	const inputs: Record<string, any> = inputStore[name];
	@InputType(`${name}${startCase(mode)}Input`)
	class Input {}
	const entries = Object.entries(inputs);
	for (const [key, input] of entries) {
		let Type = input.type;
		if (input.nest) {
			Type = getInput(Type, mode);
		}
		let required = input.required;
		if (mode === "update") {
			required = false;
		}
		Field((type) => Type, { nullable: !required })(Input.prototype, key);
	}
	for (const [key] of entries) {
		(Input as any).prototype[key] = undefined;
	}
	inputClasses[mode][name] = Input;
	return Input;
};

export const getSortClass = (target: any, prefix = "") => {
	const name = target.name + prefix;
	if (!sortStore[name]) {
		return null;
	}
	const sortKeys: Record<string, any> = sortStore[name];
	@InputType(`${name}Sort`)
	class SortClass {}
	const entries = Object.entries(sortKeys);
	for (const [key, Type] of entries) {
		Field((type) => SortDirection, { nullable: true })(SortClass.prototype, key);
	}
	for (const [key] of entries) {
		(SortClass as any).prototype[key] = undefined;
	}
	return SortClass;
};

export const isOf = (doc: any, Type: any) => {
	return doc instanceof Type;
};
type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
// type Diff<T, K> = Omit<T, keyof K>;
type PopulateOptionWithoutPath = Omit<ModelPopulateOptions, "path">;
type ComplexPopulation = [string, PopulateOptionWithoutPath];
export async function forcePopulation<T = any>(doc: DocumentType<T>, ...paths: (string | ComplexPopulation)[]) {
	let unpopulated = 0;
	for (const path of paths) {
		const isArray = Array.isArray(path);
		if (!doc.populated(isArray ? (path as ComplexPopulation)[0] : (path as string))) {
			if (isArray) {
				const options: ModelPopulateOptions = path[1] as ModelPopulateOptions;
				options.path = path[0];
				doc.populate(options);
			} else {
				doc.populate(path as string);
			}
			unpopulated++;
		}
	}
	if (unpopulated > 0) {
		doc = (await doc.execPopulate()) as DocumentType<T>;
	}
	return doc;
}

export const isObjectId = (value: string) => {
	return Types.ObjectId.isValid(value);
};
