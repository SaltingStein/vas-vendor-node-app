import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Field, ObjectType } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";

@ObjectType()
export class Packages {
	@prop({ required: true })
	@Field()
	public code!: string;

	@prop({ required: true })
	@Field()
	public title!: string;
}

@ObjectType("electricityProviders")
export class IElectricityProvider extends MyGoose {
	@prop({ required: true })
	@Field()
	public code!: string;

	@prop({ required: true })
	@Field()
	public title!: string;

	@prop({ required: true })
	@Field()
	public index!: number;

	@prop({ required: true })
	@Field(() => [Packages], {})
	public packages!: Packages[];
}

export const ElectricityProvider = getModelForClass(IElectricityProvider, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "electricityProviders" },
});
