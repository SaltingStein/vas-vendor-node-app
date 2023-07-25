import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { Field, ObjectType } from "type-graphql";
import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";
import { composePaginatedModel, editable, filterable, sortable } from "./helper";
import { App } from "@config";
import { NotFoundError, BadRequestError } from "@components/errors";

@ObjectType("Offering")
export class IOffering extends MyGoose {
	public static async findByName(this: ReturnModelType<typeof IOffering>, offeringName: string) {
		const offering = await this.findOne({
			name: offeringName,
		});
		if (!offering) {
			App.ErrorHandler.handle(new NotFoundError("Offering does not exist"));
			throw new NotFoundError("Offering does not exist");
		}
		return offering;
	}
	public static async createOffering(this: ReturnModelType<typeof IOffering>, offeringName: string) {
		const offeringExist = await this.findOne({
			name: offeringName,
		});
		if (offeringExist) {
			App.ErrorHandler.handle(new BadRequestError("Offering already exist"));
			throw new BadRequestError("Offering already exist").data({ offering: offeringName });
		}
		const offering = await this.create({ name: offeringName });
		return offering;
	}
	@prop({ required: true })
	@Field()
	@filterable()
	@sortable()
	@editable()
	public name!: string;

	@prop({ default: Date.now })
	@Field()
	@filterable()
	@sortable()
	public createdAt!: Date;

	@prop({ default: Date.now })
	@Field()
	public updatedAt!: Date;

	constructor() {
		super();
	}
}

export const Offering = getModelForClass(IOffering, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "offerings" },
});

export const PaginatedOfferingResponse = composePaginatedModel(IOffering, "PaginatedOfferingResponse");
