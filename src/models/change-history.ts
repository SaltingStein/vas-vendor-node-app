import { Field, ObjectType } from "type-graphql";
import { prop } from "@typegoose/typegoose";

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
