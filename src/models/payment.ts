import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Field, ObjectType } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";
import { composePaginatedModel, filterable, sortable } from "./helper";
import { PaymentMethods } from "@components/enums";
import { Schema } from "mongoose";

export enum PaymentStatus {
	COMPLETED = "completed",
	PENDING = "pending",
	PROCESSING = "processing",
	FAILED = "failed",
	DISPUTED = "disputed",
	REVERSED = "reversed",
	CANCELLED = "cancelled",
}
@ObjectType("Payment")
export class IPayment extends MyGoose {
	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	public transactionRef!: string;

	@prop({ required: true, enum: PaymentMethods })
	@Field()
	@filterable()
	@sortable()
	public method!: string;

	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	public amount!: number;

	@prop({ default: "" })
	@Field()
	public description!: string;

	@prop({ required: true, enum: PaymentStatus })
	@Field()
	@filterable()
	@sortable()
	public status!: PaymentStatus;

	@prop({ default: Date.now })
	@Field()
	@filterable()
	@sortable()
	public createdAt!: Date;

	@prop({ default: false })
	public isFulfilled = false;

	@prop({ default: null })
	public fulfilledAt!: Date;

	@prop({ default: {}, type: Schema.Types.Mixed })
	public metadata!: Record<string, unknown>;
}

export const Payment = getModelForClass(IPayment, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "payments" },
});

export const PaginatedPaymentResponse = composePaginatedModel(IPayment, "PaginatedPaymentResponse");
