// @ts-ignore
import { getLogNamespace } from "@components/logger";
import { App, Db } from "@config";
import enableCache from "cachegoose";
// import enableCache from "cachegoose";
import RedisCacheEngine from "cacheman-redis";
import clsMongoose from "fh-cls-mongoose";
import mongoose, { Connection, Model, Schema, SchemaOptions } from "mongoose";
import leanVirtuals from "mongoose-lean-virtuals";
import paginate from "mongoose-paginate-v2";
import { BaseConnection } from "./base";
import Redis from "./redis";

export { clearCache } from "cachegoose";

mongoose.set("debug", !App.PROD || App.ENV === "staging");

clsMongoose(getLogNamespace(), mongoose);

enableCache(mongoose, {
	engine: new RedisCacheEngine({
		client: Redis.ActiveConnection.redis,
	}),
});

declare module "mongoose" {
	interface DocumentQuery<T, DocType extends Document, QueryHelpers = {}> {
		cache(key?: string): this;
		cache(ttl?: number, key?: string): this;
	}

	interface Aggregate<T> {
		cache(key?: string): this;
		cache(ttl?: number, key?: string): this;
	}

	interface Model<T extends Document, QueryHelpers = {}> extends NodeJS.EventEmitter, ModelProperties {
		findOrCreate(
			condition: Partial<T> & { [key: string]: any },
			createData: Partial<T> & { [key: string]: any },
		): Promise<{ doc: Document & T; created: boolean }>;
		paginate(
			query?: object,
			options?: PaginateOptions,
			callback?: (err: any, result: PaginateResult<T>) => void,
		): Promise<PaginateResult<T>>;
	}
}

mongoose.plugin(function plugin(schema: Schema) {
	schema.statics.findOrCreate = async function findOrCreate(this: Model<any>, findByQuery: any, createData: any = {}) {
		const doc = await this.findOne(findByQuery);
		return doc
			? { doc, created: false }
			: {
					doc: await this.create({ ...findByQuery, ...createData }),
					created: true,
			  };
	};
});

(paginate as any).paginate.options = {
	page: 1,
	limit: 20,
	customLabels: {
		totalDocs: "totalItems",
		docs: "items",
		limit: "size",
		page: "current",
		nextPage: "next",
		prevPage: "previous",
		totalPages: "count",
		pagingCounter: "index",
		meta: "pager",
	},
};

mongoose.plugin(paginate);
mongoose.plugin(leanVirtuals);

export const SCHEMA_OPTIONS: SchemaOptions = {
	timestamps: true,
};

export class MongoConnection extends BaseConnection<Connection> {
	public createConnection() {
		return mongoose
			.createConnection(Db.MONGO_URI, {
				useNewUrlParser: true,
				useCreateIndex: true,
				useFindAndModify: false,
				useUnifiedTopology: true,
			})
			.on("connected", () => {
				console.log("MongoDB connected");
			});
	}
}

export default new MongoConnection();
