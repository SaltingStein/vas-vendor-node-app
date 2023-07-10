import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Schema } from "mongoose";
import { Field, ObjectType } from "type-graphql";
import { ReturnModelType, prop, getModelForClass } from "@typegoose/typegoose";
import { editable, filterable, sortable } from "./helper";

@ObjectType("RecoverableLoses")
export class ISavedRecoerableLoses extends MyGoose {
	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public serviceType!: string;

	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public identifier!: string;

	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public transactionRef!: string;

	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public amount!: number;

	@prop({ default: false })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public recovered!: boolean;

	@prop({ required: true, type: Schema.Types.Mixed })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public orderInfo!: Schema.Types.Mixed;

	@prop({ default: Date.now })
	@Field()
	@filterable()
	@sortable()
	public createdAt!: Date;

	@prop({ default: Date.now })
	@Field()
	public updatedAt!: Date;

	public static async createRecoverableLose(
		this: ReturnModelType<typeof ISavedRecoerableLoses>,
		serviceType: string,
		identifier: string,
		transactionRef: string,
		orderInfo: object,
	) {
		const meterDetail = await this.findOne({ transactionRef });

		if (!meterDetail) {
			const data = {
				serviceType,
				identifier,
				transactionRef,
				orderInfo,
			};

			const createDetail = await this.create(data as ISavedRecoerableLoses);
			return { message: "Recoverable lose created successfully", data: createDetail };
		} else {
			return { message: "Recoverable lose already exists", data: meterDetail };
		}
	}
}

export const SavedRecoverableLoses = getModelForClass(ISavedRecoerableLoses, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "recoverableLoses" },
});
