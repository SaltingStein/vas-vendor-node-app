import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Schema } from "mongoose";
import { Field, ObjectType } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";

@ObjectType("cabletvBouquets")
export class ICabletvBouquets extends MyGoose {
	@prop({ required: true })
	@Field()
	public providerId!: string;

	@prop({ required: true })
	@Field()
	public bouquets!: Schema.Types.Mixed;
}

export const CabletvBouquets = getModelForClass(ICabletvBouquets, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "cabletvBouquets" },
});
