import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Field, ObjectType } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";

@ObjectType("airtimeProviders")
export class IAirtimeProviders extends MyGoose {
	@prop({ required: true })
	@Field()
	public code!: string;

	@prop({ required: true })
	@Field()
	public title!: string;
}

export const AirtimeProviders = getModelForClass(IAirtimeProviders, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "airtimeProviders" },
});
