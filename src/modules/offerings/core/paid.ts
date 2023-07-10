import { Artifact } from "@components/artifact";
import { OrderStatus, OrderData, IOrder } from "@components/order";
import { BaseOfferingHandler, FulfillmentRequestData } from "./base";

export interface PaymentMetadata {
	metaname: string;
	metavalue: string;
}

export class PaidOfferingHandler extends BaseOfferingHandler<FulfillmentRequestData> {
	public async getAmount(): Promise<number> {
		throw new Error("Base has no usable implementation. Child classes must implement this method");
	}

	public async beforePayment(): Promise<void> {
		return;
	}

	public async fulfil() {
		try {
			let artifact = new Artifact();
			const orderDetails: OrderData = new IOrder(
				await this.getDescription(),
				this.source.sourceId,
				this.offering.name,
				this.params.productType,
				this.params.providerCode,
				this.params.providerId,
				this.source.sessionId,
				this.params.amount,
				OrderStatus.PROCESSING,
			);
			try {
				artifact = await super.fulfil();
			} catch (error: any) {
				orderDetails.status = OrderStatus.FAILED;
				orderDetails.failureReason = error;
				// await (this.data as OfferingOrder).save();
				// Event.emit(EventType.ORDER_FAILED, {
				// 	order: this.data as OfferingOrder,
				// 	handler: this,
				// } as OrderFailedEvent);
				throw error;
			}
			orderDetails.artifact = artifact as any;
			orderDetails.status = OrderStatus.COMPLETED;
			// (this.data as OfferingOrder).markModified("artifact");
			return artifact.andLogActivity({
				phone: this.source.sourceId,
				source: this.source.source,
				sessionId: this.source.sessionId,
			});
		} catch (error) {
			throw error;
		}
	}

	public async init() {
		super.init();
		return true;
	}
}
