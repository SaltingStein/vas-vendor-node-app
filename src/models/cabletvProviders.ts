import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Field, ObjectType } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";

@ObjectType("cabletvProviders")
export class ICabletvProviders extends MyGoose {
	@prop({ required: true })
	@Field()
	public code!: string;

	@prop({ required: true })
	@Field()
	public providerCode!: string;

	@prop({ required: true })
	@Field()
	public title!: string;
}

export const CabletvProviders = getModelForClass(ICabletvProviders, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "cabletvProviders" },
});
