import { ValidationError, AppError, ServiceUnavailableError } from "@components/errors";
import { Offering, IOffering, DocumentType, Order, OrderStatus, Payment, PaymentStatus } from "@models";
import { findOfferingHandler, FulfillmentRequestData, PaidOfferingHandler } from "../modules/offerings";
import { PaymentMethods } from "@components/enums";

async function getHandler(offering: DocumentType<IOffering>) {
	const Handler = (await findOfferingHandler(offering.name)) as typeof PaidOfferingHandler;
	return Handler;
}

export async function fulfill(data: FulfillmentRequestData) {
	try {
		console.log("______New Offline Pay request", data);
		const service = await Offering.findByName(data.offering);
		const Handler = await getHandler(service);
		const handler = new Handler(data);
		const { source, params } = handler.data;
		const txnRef = source.sessionId;
		const transRefExist = await Order.findOne({ "source.sessionId": source.sessionId });
		console.log("___________Check OfflineTransRef", transRefExist);
		if (transRefExist) {
			throw new ValidationError("Transaction ref already exists");
		}

		const { doc: payment } = await Payment.findOrCreate(
			{ txnRef },
			{
				processorRef: txnRef,
				txnRef,
				dedupRef: txnRef,
				customerPhone: source.sourceId,
				method: PaymentMethods.WALLET,
				amount: await handler.getAmount(),
				processor: source.source,
				status: PaymentStatus.PROCESSING,
				isAgent: false,
			},
		);

		// Create new Order
		await handler.beforePayment();

		await Order.findOrCreate(
			{ payment: payment.id },
			{
				status: OrderStatus.PENDING,
				params,
				offering: service._id,
				source,
			},
		);

		const artifact = await handler.fulfil();
		console.log("Artifact Gotten: " + JSON.stringify(artifact));
		return artifact;
	} catch (error: any) {
		// console.error(error);
		if (error instanceof AppError) {
			throw error;
		} else if (error.httpCode.toString().includes(4)) {
			throw new ValidationError(error.message);
		} else {
			throw new ServiceUnavailableError("Offline payment fulfillment", error);
		}
	}
}
