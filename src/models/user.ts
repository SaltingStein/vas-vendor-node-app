import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { SourceObject } from "@modules/source";
import bcrypt from "bcrypt";
import { Field, ObjectType } from "type-graphql";
import { ReturnModelType, pre, prop, getModelForClass } from "@typegoose/typegoose";
import { composePaginatedModel, filterable, sortable } from "./helper";
import { App } from "@config";

export class IUserMetas {
	@prop({ default: 0 })
	public profileUpdated = false;

	@prop({ default: 0 })
	public sessionCount = 0;

	@prop({ default: Date.now })
	public lastVisited!: Date;
}

@pre<IUser>("save", function (next) {
	if (this.isNew && !this.phone && !this.email) {
		App.ErrorHandler.handle(new Error("At least Phone or Email must be set"));
		throw new Error("At least Phone or Email must be set");
	}
	this.updatedAt = new Date();
	if ((this.firstName === "" || this.lastName === "") && this.metas!.profileUpdated) {
		this.metas.profileUpdated = false;
	}
	if (this.isModified("password")) {
		this.password = bcrypt.hashSync(this.password, 10);
	}
	next();
})
@ObjectType("User")
export class IUser extends MyGoose {
	public static async findByPhone(this: ReturnModelType<typeof IUser>, phone: string, extras: Partial<Omit<IUser, "phone">> = {}) {
		return this.findOne({
			...extras,
			phone,
		});
	}

	public static async findOrCreateFromSource(this: ReturnModelType<typeof IUser>, { source, sourceId }: SourceObject) {
		const user = await this.findOrCreate(
			{ phone: sourceId },
			{
				socialProfiles: new Map(Object.entries({ [source]: sourceId })),
			},
		);
		if (!user.created) {
			user.doc.socialProfiles.set(source, sourceId);
			user.doc.markModified("socialProfiles");
			await user.doc.save();
		}
		return user;
	}

	@prop({ required: false, maxlength: 13, minlength: 13, unique: true, sparse: true })
	@Field({ nullable: true })
	@filterable()
	@sortable()
	public phone!: string;

	@prop({ required: false, maxlength: 45, default: "" })
	@Field()
	@filterable()
	public firstName!: string;

	@prop({ required: false, maxlength: 45, default: "" })
	@Field()
	@filterable()
	public lastName!: string;

	@prop({ required: false, unique: true, default: null })
	@Field({ nullable: true })
	@filterable()
	public email!: string;
	@prop({ required: false, default: null }) public password!: string;

	@prop({ default: new Map<string, any>(), type: String })
	public socialProfiles!: Map<string, any>;

	@prop({ _id: false, default: new IUserMetas() })
	public metas: IUserMetas;

	@prop({ default: Date.now })
	@Field()
	@filterable()
	@sortable()
	public createdAt!: Date;

	@prop({ default: Date.now })
	public updatedAt!: Date;

	constructor() {
		super();
		this.metas = new IUserMetas();
		this.socialProfiles = new Map<string, any>();
	}

	get siteEmail() {
		return `${this.phone}@myfela.ng`;
	}

	public get name() {
		return `${this.firstName} ${this.lastName}`;
	}

	public set name(name: string) {
		const parts = name.split(" ");
		this.firstName = parts[0];
		this.lastName = parts[1];
	}

	public hasVisitedToday() {
		const lastVisited = new Date(this.metas.lastVisited);
		const today = new Date();
		if (
			lastVisited.getDate() === today.getDate() &&
			lastVisited.getMonth() === today.getMonth() &&
			lastVisited.getFullYear() === today.getFullYear()
		) {
			return true;
		}
	}

	public verifyPassword(password: string) {
		return bcrypt.compareSync(password, this.password);
	}
}

export const User = getModelForClass(IUser, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "users" },
});

export const PaginatedUserResponse = composePaginatedModel(IUser, "PaginatedUserResponse");
