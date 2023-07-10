import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { getShortId } from "@libs/utils";
import { ReturnModelType, prop, getModelForClass } from "@typegoose/typegoose";

export class ISource extends MyGoose {
	public static findByName(this: ReturnModelType<typeof ISource>, name: string) {
		return this.findOne({ name }).exec();
	}

	public static findByShortId(this: ReturnModelType<typeof ISource>, shortId: string) {
		return this.findOne({ shortId }).exec();
	}

	@prop({ required: true, unique: true })
	public name!: string;

	@prop({
		default() {
			return getShortId();
		},
		unique: true,
	})
	public shortId!: string;
}

export const Source = getModelForClass(ISource, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "sources" },
});
