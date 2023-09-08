import { Artifact } from "@components/artifact";
import { OrderStatus, OrderData } from "@components/order";
import { Order } from "@models";
import { BaseOfferingHandler, FulfillmentRequestData } from "./base";

export interface PaymentMetadata {
	metaname: string;
	metavalue: string;
}

export class PaidOfferingHandler extends BaseOfferingHandler<FulfillmentRequestData> {
	private order: any;
	public async getAmount(): Promise<number> {
		throw new Error("Base has no usable implementation. Child classes must implement this method");
	}

	public async beforePayment(): Promise<void> {
		return;
	}

	public async fulfil() {
		let artifact = new Artifact();
		const order = await this.getOrder();
		try {
			artifact = await super.fulfil();
			order.artifact = artifact;
			order.status = OrderStatus.COMPLETED;
			order.description = this.getDescription();
			order.markModified("artifact");
			const payment = this.order.payment;
			payment.description = this.getDescription();
			payment.amount = this.params.amount;
			payment.isFulfilled = true;
			payment.fulfilledAt = new Date();
			payment.status = OrderStatus.COMPLETED;
			await Promise.all([order.save(), payment.save()]);
			return artifact.andLogActivity({
				sourceId: this.source.sourceId,
				source: this.source.source,
				sessionId: this.source.sessionId,
			});
		} catch (error: any) {
			order.description = this.getDescription();
			order.status = OrderStatus.FAILED;
			order.lastError = error.maskedData || error;
			const payment = this.order.payment;
			payment.description = this.getDescription();
			await Promise.all([order.save(), payment.save()]);
			throw error;
		}
	}

	public async init() {
		await super.init();
		return true;
	}

	public getOrder() {
		return this.order;
	}

	public async setOrder(order: any) {
		this.order = order;
		return;
	}

	public async processOrder(orderId: string) {
		try {
			const order = await Order.load(orderId);
			if (!order) {
				throw new Error("Order not found in DB");
			}

			order.status = OrderStatus.PROCESSING;
			await order.save();

			await this.setOrder(order);

			return await this.fulfil();
		} catch (error) {
			throw error;
		}
	}
}
