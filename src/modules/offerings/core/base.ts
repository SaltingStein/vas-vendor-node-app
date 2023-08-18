import { Artifact } from "@components/artifact";
import { ValidationError } from "@components/errors";
import { OneOf, validate, ValidationNode } from "@libs/validator";
import { DocumentType, IOffering, Offering, IOrder } from "@models";
import { SessionSourceObject } from "@modules/source";

export type OfferingOrder = DocumentType<IOrder>;

export interface OfferingData {
	offering: DocumentType<IOffering> | string;
	params: Record<string, any>;
	source: SessionSourceObject;
}

export interface FulfillmentRequestData {
	offering: string;
	params: Record<string, any>;
	source: SessionSourceObject;
}

export type OfferingOrderOrData = OfferingOrder | OfferingData;

export class BaseOfferingHandler<T extends FulfillmentRequestData> {
	public static spec() {
		return {};
	}

	public data: T;
	public offering!: DocumentType<IOffering>;
	public params!: Record<string, any>;
	public source!: SessionSourceObject;

	constructor(data: T) {
		this.data = data;
	}

	public async validator(): Promise<(ValidationNode | OneOf)[]> {
		throw new Error("Base has no usable implementation. Child classes must implement this method");
	}

	public async fulfil() {
		try {
			await this.validate();
			const artifact = await this.value();
			artifact.setAsActivity({
				key: `offering:${this.offering.name}:fulfil`,
				description: this.getDescription(),
				params: this.params || {},
			});
			return artifact;
		} catch (error) {
			throw error;
		}
	}

	public async beforeValidate(): Promise<boolean> {
		return true;
	}

	public getDescription() {
		return "";
	}

	public async validate() {
		await this.init();
		const beforeHook = await this.beforeValidate();
		if (!beforeHook) {
			throw new ValidationError()
				.setData({
					validation_failed: true,
					errors: [
						{
							parameter: "preValidation",
							message: "preValidation failed!",
						},
					],
				})
				.setInput(this.params);
		}
		const constraints = await this.validator();
		const errors = await validate(this.params, constraints);
		if (errors.length > 0) {
			throw new ValidationError().setData({ validationFailed: true, errors }).setInput(this.data);
		}
		return true;
	}

	public async init() {
		this.offering = (await Offering.findByName(this.data.params.productName)) as DocumentType<IOffering>;
		this.params = this.data.params;
		this.source = this.data.source;
		return true;
	}

	protected async value(): Promise<Artifact> {
		throw new Error("Base has no usable implementation. Child classes must implement this method");
	}
}
