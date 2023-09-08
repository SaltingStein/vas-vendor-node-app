import Mongo, { SCHEMA_OPTIONS } from "@connections/mongo";
import { MyGoose } from "@libs/mygoose";
import { ObjectType } from "type-graphql";
import { prop, getModelForClass, ReturnModelType } from "@typegoose/typegoose";
import { NotFoundError, BadRequestError } from "@components/errors";

export interface BundleSchema {
	code: number;
	product: string;
	provider: string;
}

@ObjectType("CashtokenBundles")
export class ICashtokenBundles extends MyGoose {
	public static async createBundle(this: ReturnModelType<typeof ICashtokenBundles>, payload: BundleSchema) {
		const bundleExist = await this.findOne({
			$or: [{ product: payload.product, provider: payload.provider }, { code: payload.code }],
		});
		if (bundleExist) {
			throw new BadRequestError("Bundle with some of the provided properties already exist").setData({ ...payload });
		}
		const bundle = await this.create({ ...payload });
		return bundle;
	}
	public static async findByCode(this: ReturnModelType<typeof ICashtokenBundles>, code: number) {
		const bundle = await this.findOne(
			{
				code,
			},
			{ code: 1, product: 1, provider: 1, _id: 0 },
		);
		if (!bundle) {
			return null;
		}
		return bundle;
	}
	public static async fetchBundles(this: ReturnModelType<typeof ICashtokenBundles>, filter: any = {}) {
		const bundles = await this.find(filter, { code: 1, product: 1, provider: 1, _id: 0 });
		const cashtokenBundles: {
			[x: number]: {
				code: number;
				product: string;
				provider: string;
			};
		} = {};

		if (bundles.length > 0) {
			for (const bundle of bundles) {
				const newBundle = {
					[bundle.code]: {
						code: bundle.code,
						product: bundle.product,
						provider: bundle.provider,
					},
				};

				Object.assign(cashtokenBundles, newBundle);
			}
			return cashtokenBundles;
		}
		return cashtokenBundles;
	}
	@prop({ required: true, unique: true })
	public code!: number;

	@prop({ required: true })
	public product!: string;

	@prop({ required: true })
	public provider!: string;
}

export const CashtokenBundles = getModelForClass(ICashtokenBundles, {
	existingConnection: Mongo.ActiveConnection,
	schemaOptions: { ...SCHEMA_OPTIONS, collection: "cashtokenBundles" },
});
