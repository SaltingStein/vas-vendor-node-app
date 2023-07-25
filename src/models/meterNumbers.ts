import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Schema } from "mongoose";
import { Field, ObjectType, registerEnumType } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";

export enum AccountType {
	PREPAID = "prepaid",
	POSTPAID = "postpaid",
}

registerEnumType(AccountType, {
	name: "accountType",
});

@ObjectType("meterNumbers")
export class IMeterNumbers extends MyGoose {
	@prop({ required: true })
	@Field()
	public disco!: string;

	@prop({ required: true })
	@Field()
	public meterNumber!: string;

	@prop({ required: true, enum: Object.values(AccountType) })
	@Field(() => AccountType)
	public accountType!: AccountType;

	@prop({ required: true })
	public details!: Schema.Types.Mixed;
}

export const MeterNumbers = getModelForClass(IMeterNumbers, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, validateBeforeSave: false, collection: "meterNumbers" },
});
