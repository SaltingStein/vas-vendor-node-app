import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { ReturnModelType, prop, getModelForClass } from "@typegoose/typegoose";

export class IActivity extends MyGoose {
	public static log(this: ReturnModelType<typeof IActivity>, activity: Partial<IActivity>, silent = true) {
		try {
			return this.create(activity as IActivity);
		} catch (error) {
			if (!silent) {
				throw error;
			}
			return null;
		}
	}

	@prop({ required: true })
	public sourceId!: string;

	@prop({ required: true })
	public source!: string;

	@prop({ required: true })
	public sessionId!: string;

	@prop({ required: false })
	public key!: string;

	@prop({ required: true })
	public description!: string;

	@prop({ default: {} })
	public params!: object;

	@prop({ default: true })
	public successful = true;
}

export const Activity = getModelForClass(IActivity, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "activities" },
});
