import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Field, ObjectType } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";

@ObjectType("dataBundleProviders")
export class IDataBundleProviders extends MyGoose {
	@prop({ required: true })
	@Field()
	public code!: string;

	@prop({ required: true })
	@Field()
	public title!: string;
}

export const DataBundleProviders = getModelForClass(IDataBundleProviders, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "dataBundleProviders" },
});
