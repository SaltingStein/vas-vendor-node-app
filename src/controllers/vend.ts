import { ValidationError, AppError, ServiceUnavailableError } from "@components/errors";
import { Offering, IOffering, DocumentType, Order, OrderStatus, Payment, PaymentStatus } from "@models";
import { findOfferingHandler, FulfillmentRequestData, PaidOfferingHandler } from "../modules/offerings";
import { PaymentMethods } from "@components/enums";
import Ewallet from "@libs/wallet";
import { TransactionTypes } from "@models/walletTransactions";
import { listSources } from "@modules/lists";

async function getHandler(offering: DocumentType<IOffering>) {
	const Handler = (await findOfferingHandler(offering.name)) as typeof PaidOfferingHandler;
	return Handler;
}

export async function fulfill(data: FulfillmentRequestData) {
	try {
		console.log("______New Offline Pay request", data);
		const service = await Offering.findByName(data.params.productName);
		const Handler = await getHandler(service);
		const handler = new Handler(data);
		const { source, params } = handler.data;
		const txnRef = source.sessionId;
		const transRefExist = await Order.findOne({ "source.sessionId": txnRef });
		console.log("___________Check OrderTransRef", transRefExist);
		if (transRefExist) {
			throw new ValidationError("Transaction reference already exists");
		}
		const amount = await getOrderAmount(params.productName, handler.data, params?.productType || null);
		console.log("I HAVE FOUND AMOUNT", amount);
		await Ewallet.transfer(2, 1, Number.parseFloat(amount), txnRef, TransactionTypes.DEBIT);
		throw new Error("ERROR OCCURRED");
		// return "I am done";
		const { doc: payment } = await Payment.findOrCreate(
			{ txnRef },
			{
				transactionRef: txnRef,
				customerPhone: source.sourceId,
				method: PaymentMethods.WALLET,
				processor: source.source,
				status: PaymentStatus.PROCESSING,
				isAgent: false,
			},
		);

		await handler.beforePayment();
		const commissions: any = {
			helo: "me",
		};
		const { doc: order } = await Order.findOrCreate(
			{ payment: payment.id },
			{
				status: OrderStatus.PENDING,
				params,
				offering: service._id,
				source,
				commissions: commissions,
			},
		);

		const artifact = await handler.processOrder(order.id);
		console.log("Artifact Gotten: " + JSON.stringify(artifact));
		return artifact;
	} catch (error: any) {
		await Ewallet.reverseDebit(data.source.sessionId);
		console.error("CONTROLLER ERROR HANDLER", error);
		if (error instanceof AppError) {
			throw error;
		} else {
			throw new ServiceUnavailableError("Order fulfillment", error);
		}
	}
}

async function getOrderAmount(productName: string, data: FulfillmentRequestData, productType: string | null = null) {
	const offerings = await listSources.offerings();
	const exempted = ["airtime", "electricity"];
	if (exempted.includes(productName)) {
		return data.params.amount;
	}
	if (!offerings || offerings.length < 1) {
		throw new Error("Unable to retrieve offering. Please try again");
	} else if (!offerings.includes(productName)) {
		throw new Error(`Invalid product name ${productName} provided`);
	}
	switch (productName) {
		case "databundle":
			const dataBundles = (await listSources.dataBundles({ provider_code: productType })) as {
				[x: string]: { code: string; title: string; price: number; providerId: string };
			};
			if (dataBundles[data.params.providerCode]) {
				return dataBundles[data.params.providerCode]["price"];
			} else {
				throw new Error("Unable to retrieve databundle. Please try again");
			}
		case "cableTv":
			const bouquets = (await listSources.cabletvBouquets({ provider_code: productType })) as {
				[x: string]: {
					code: string;
					title: string;
					price: number;
					slug: string;
				};
			};
			if (bouquets[data.params.providerCode]) {
				return bouquets[data.params.providerCode]["price"];
			} else {
				throw new Error("Unable to retrieve bouquets. Please try again");
			}
	}
}
