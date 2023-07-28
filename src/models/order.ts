import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { SessionSourceObject } from "@modules/source";
import { Schema } from "mongoose";
import { Field, ObjectType, registerEnumType } from "type-graphql";
import { ReturnModelType, pre, prop, Ref, getModelForClass } from "@typegoose/typegoose";
import { composePaginatedModel, filterable, sortable } from "./helper";
import { IOffering } from "./offering";
import { IPayment } from "./payment";
import { IUser } from "./user";

export enum OrderStatus {
	COMPLETED = "completed",
	PENDING = "pending",
	PROCESSING = "processing",
	QUEUED = "queued",
	FAILED = "failed",
	FAILED_DONTRETY = "failed_dontretry",
	DISPUTED = "disputed",
	REVERSED = "reversed",
	PERMANENTLY_FAILED = "permanently_failed",
}

registerEnumType(OrderStatus, {
	name: "OrderStatus",
});

export enum RewardStatus {
	COMPLETED = "completed",
	PENDING = "pending",
	QUEUED = "queued",
	FAILED = "failed",
	DISPUTED = "disputed",
	NOT_ALLOWED = "not_allowed",
}

registerEnumType(RewardStatus, {
	name: "RewardStatus",
});

@ObjectType()
export class OrderSource implements SessionSourceObject {
	@prop({ required: true })
	@Field()
	public source!: string;

	@prop({ required: true })
	@Field()
	public sourceId!: string;

	@prop({ required: true })
	@Field()
	public sessionId!: string;
}

export class Commission {
	@prop({ required: true })
	@Field()
	public vendAmount!: string;

	@prop({ required: true })
	@Field()
	public commissionRate!: string;

	@prop({ required: true })
	@Field()
	public commissionGained!: string;

	@prop({ required: true })
	@Field()
	public discountedAmount!: string;
}

@ObjectType()
export class ChangeHistory {
	@prop({ required: true, default: null })
	@Field(() => String, { nullable: true })
	public from!: string | null;

	@prop({ required: true })
	@Field()
	public to!: string;

	@prop({ default: Date.now })
	@Field()
	public date!: Date;
}

@pre<IOrder>("save", function (next) {
	if (this.isModified("status") && (this as any)._oldStatus) {
		this.history.push({
			from: (this as any)._oldStatus || null,
			to: this.status,
			date: new Date(),
		});
		this.markModified("history");
	}
	next();
})
@ObjectType("Order")
export class IOrder extends MyGoose {
	public static async load(this: ReturnModelType<typeof IOrder>, id: string) {
		return await this.findById(id)
			.populate("payment")
			.populate({
				path: "offering",
			})
			.exec();
	}
	@prop({ ref: IPayment, required: true, unique: true })
	@Field(() => IPayment)
	public payment!: Ref<IPayment>;

	@prop({ ref: IUser })
	@Field(() => IUser)
	public user!: Ref<IUser>;

	@prop({ default: "" })
	@Field()
	public description!: string;

	@prop({ ref: IOffering, required: true })
	@Field(() => IOffering)
	public offering!: Ref<IOffering>;

	@prop({ required: true })
	public params!: object;

	@prop({ _id: false, required: true, default: new OrderSource() })
	@Field(() => OrderSource)
	public source: OrderSource = new OrderSource();

	@prop({ default: {}, type: Schema.Types.Mixed })
	public artifact!: Schema.Types.Mixed;

	@prop({ default: null })
	public lastError!: Schema.Types.Mixed;

	@prop({ required: true })
	public commissions!: Schema.Types.Mixed;

	@prop({
		required: true,
		enum: Object.values(OrderStatus),
		set(value) {
			(this as any)._oldStatus = (this as any).status;
			return value;
		},
		get(value) {
			return value;
		},
	})
	@Field(() => OrderStatus)
	@filterable()
	@sortable()
	public status!: OrderStatus;

	@prop({ _id: false, default: [] })
	@Field(() => [ChangeHistory], { defaultValue: [] })
	public history!: ChangeHistory[];
}

export const Order = getModelForClass(IOrder, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "orders" },
});

export const PaginatedOrderResponse = composePaginatedModel(IOrder, "PaginatedOrderResponse");
