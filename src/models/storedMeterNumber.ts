import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Schema } from "mongoose";
import { Field, ObjectType } from "type-graphql";
import { ReturnModelType, prop, getModelForClass } from "@typegoose/typegoose";
import { editable, filterable, sortable } from "./helper";

@ObjectType("SavedMeterDetails")
export class ISavedMeterDetails extends MyGoose {
	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public meterNo!: string;

	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public disco!: string;

	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public meterType!: string;

	@prop({ required: true, type: Schema.Types.Mixed })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public customerInfo!: Schema.Types.Mixed;

	@prop({ default: Date.now })
	@Field()
	@filterable()
	@sortable()
	public createdAt!: Date;

	@prop({ default: Date.now })
	@Field()
	public updatedAt!: Date;

	public static async storeMeterDetail(
		this: ReturnModelType<typeof ISavedMeterDetails>,
		meterNo: string,
		meterType: string,
		customerInfo: object,
		disco: string,
	) {
		const meterDetail = await this.findOne({ meterNo, disco, meterType });

		if (!meterDetail) {
			const data = {
				meterType: meterType.toUpperCase(),
				meterNo,
				disco: disco.toUpperCase(),
				customerInfo: customerInfo,
			};

			const createDetail = await this.create(data as ISavedMeterDetails);
			return { message: "Meter detail created successfully", data: createDetail };
		} else {
			return { message: "Meter detail already exists", data: meterDetail };
		}
	}
}

export const SavedMeterDetails = getModelForClass(ISavedMeterDetails, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "savedMeterDetails" },
});
