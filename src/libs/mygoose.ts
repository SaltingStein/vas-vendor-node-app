import { Field, ObjectType } from "type-graphql";
import { prop, setGlobalOptions, Severity } from "@typegoose/typegoose";

setGlobalOptions({
	options: {
		allowMixed: Severity.ALLOW,
	},
});

@ObjectType()
export class MyGoose {
	@Field({ nullable: true })
	public id!: string;

	@prop({ default: Date.now })
	@Field({ nullable: true })
	public createdAt!: Date;

	@prop({ default: Date.now })
	public updatedAt!: Date;
}
