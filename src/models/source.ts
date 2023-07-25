import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { getShortId } from "@libs/utils";
import { ReturnModelType, prop, getModelForClass } from "@typegoose/typegoose";
import { BadRequestError } from "@components/errors";
import { App } from "@config";
export class ISource extends MyGoose {
	public static findByName(this: ReturnModelType<typeof ISource>, name: string) {
		return this.findOne({ name }).exec();
	}

	public static findByShortId(this: ReturnModelType<typeof ISource>, shortId: string) {
		return this.findOne({ shortId }).exec();
	}

	public static async createSource(this: ReturnModelType<typeof ISource>, sourceName: string) {
		const sourceExist = await this.findOne({
			name: sourceName,
		});
		if (sourceExist) {
			App.ErrorHandler.handle(new BadRequestError("Source already exist"));
			throw new BadRequestError("Source already exist").data({ source: sourceName });
		}
		const source = await this.create({ name: sourceName });
		return source;
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
