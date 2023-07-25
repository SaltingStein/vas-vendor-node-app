import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Field, ObjectType } from "type-graphql";
import { prop, getModelForClass } from "@typegoose/typegoose";
import { composePaginatedModel, filterable, sortable } from "./helper";

export enum TransactionTypes {
	DEBIT = "debit",
	REVERSAL = "reversal",
}

export enum PaymentStatus {
	COMPLETED = "completed",
	PENDING = "pending",
	PROCESSING = "processing",
	FAILED = "failed",
	DISPUTED = "disputed",
	REVERSED = "reversed",
	CANCELLED = "cancelled",
}

@ObjectType("WalletTransaction")
export class IWalletTransaction extends MyGoose {
	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	public refId!: string;

	@prop({ required: true, enum: TransactionTypes })
	@Field()
	@filterable()
	@sortable()
	public type!: TransactionTypes;

	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	public amount!: number;

	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	public balBefore!: number;

	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	public balAfter!: number;

	@prop({ required: true })
	@Field()
	public dstUserId!: number;

	@prop({ required: true })
	@Field()
	public srcUserId!: number;

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
}

export const WalletTransaction = getModelForClass(IWalletTransaction, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "WalletTransaction" },
});

export const PaginatedPaymentResponse = composePaginatedModel(IWalletTransaction, "PaginatedWalletTransactiontResponse");
