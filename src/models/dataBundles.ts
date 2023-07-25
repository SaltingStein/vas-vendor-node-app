import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Schema } from "mongoose";
import { Field, ObjectType } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";

@ObjectType("dataBundles")
export class IDataBundles extends MyGoose {
	@prop({ required: true })
	@Field()
	public providerId!: string;

	@prop({ required: true })
	@Field()
	public bundles!: Schema.Types.Mixed;
}

export const DataBundles = getModelForClass(IDataBundles, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, validateBeforeSave: false, collection: "dataBundles" },
});
