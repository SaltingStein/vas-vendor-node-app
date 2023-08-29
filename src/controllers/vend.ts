import { MySQL } from "@config";
import { ValidationError, AppError, ServiceUnavailableError, BadRequestError } from "@components/errors";
import { Offering, IOffering, DocumentType, Order, OrderStatus, Payment, PaymentStatus } from "@models";
import { findOfferingHandler, FulfillmentRequestData, PaidOfferingHandler } from "../modules/offerings";
import { PaymentMethods } from "@components/enums";
import Ewallet from "@libs/wallet";
import { TransactionTypes } from "@models/walletTransactions";
import { listSources } from "@modules/lists";
import * as Interface from "@libs/WPCore/interfaces";

export interface RefactoredSchema {
	vendAmount?: string;
	discount?: string;
	rewardThreshold?: string;
	UtilityRewardAmount?: string;
	utilityRewardRate?: string;
	rewardAmount?: string;
	rewardRate?: string;
	referralAmount?: string;
	referralRate?: string;
}

async function getHandler(offering: DocumentType<IOffering>) {
	const Handler = (await findOfferingHandler(offering.name)) as typeof PaidOfferingHandler;
	return Handler;
}

// async function calculateUtilityBundle(amount, service) {

// }

function merchantCanVendService(user: Interface.Data, offering: string, productType: string) {
	const { commissions } = user;
	const merchantAvailableServices = commissions[offering];
	if (!merchantAvailableServices || !merchantAvailableServices[productType]) {
		throw new BadRequestError(`You do not have authorization to vend the provided service(${productType})`);
	}
	let serviceCommission: RefactoredSchema | null = null;
	for (const element in merchantAvailableServices[productType]) {
		switch (element) {
			case "discount":
				serviceCommission = serviceCommission
					? Object.assign(serviceCommission, { discount: merchantAvailableServices[productType]["discount"] })
					: { discount: merchantAvailableServices[productType]["discount"] || "0" };
				break;
			case "custormerreward":
				serviceCommission
					? Object.assign(serviceCommission, { rewardRate: merchantAvailableServices[productType]["custormerreward"] })
					: { rewardRate: merchantAvailableServices[productType]["custormerreward"] || "0" };
				break;
			case "rewardthreshold":
				serviceCommission
					? Object.assign(serviceCommission, { rewardThreshold: merchantAvailableServices[productType]["rewardthreshold"] })
					: { rewardThreshold: merchantAvailableServices[productType]["rewardthreshold"] || "0" };
			case "referrer":
				serviceCommission
					? Object.assign(serviceCommission, { referralRate: merchantAvailableServices[productType]["referrer"] })
					: { referralRate: merchantAvailableServices[productType]["referrer"] || "0" };
		}
	}

	return serviceCommission as RefactoredSchema;
}

export async function fulfill(data: FulfillmentRequestData, user: Interface.Data) {
	try {
		console.log("______New Offline Pay request", data);
		const service = await Offering.findByName(data.params.productName);
		const Handler = await getHandler(service);
		// Retrieve merchant commission configuration
		const commissions: RefactoredSchema = merchantCanVendService(user, service.name, data.params.productType.toLowerCase());
		console.log("COMMISSIONS", commissions);
		const handler = new Handler(data);
		const { source, params } = handler.data;
		const txnRef = source.sessionId;
		const transRefExist = await Order.findOne({ "source.sessionId": txnRef });
		console.log("___________Check OrderTransRef", transRefExist);
		if (transRefExist) {
			throw new ValidationError("Transaction reference already exists");
		}
		const amount = await getOrderAmount(params.productName, handler.data, params?.productType || null);
		const commissionCalculated: RefactoredSchema = calculateCommission(amount, commissions["discount"] as string);
		console.log("COMMISSION CALCULATED", commissionCalculated);
		await Ewallet.transfer(user.id, MySQL.systemUser, Number.parseFloat(amount), txnRef, TransactionTypes.DEBIT);
		// throw new Error("ERROR OCCURRED");
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
		const { doc: order } = await Order.findOrCreate(
			{ payment: payment.id },
			{
				status: OrderStatus.PENDING,
				params,
				offering: service._id,
				source,
				commissions: commissionCalculated,
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
		// case "utilityBundle":
	}
}

function calculateCommission(amount: string, commissionRate: string, referralRate = "5", rewardRate = "2") {
	const commissionGained = (Number(amount) * (Number(commissionRate) / 100)).toFixed(2);
	let referralAmount = "0";
	let rewardAmount = "0";
	if (Number(commissionGained) > 0) {
		referralAmount = (Number(commissionGained) * (Number(referralRate) / 100)).toFixed(2);
		rewardAmount = (Number(commissionGained) * (Number(rewardRate) / 100)).toFixed(2);
	}
	const commissionEarned = Number(commissionGained) - (Number(referralAmount) + Number(rewardAmount));
	const vasAmount = (Number(amount) - Number(commissionEarned)).toFixed(2);

	return {
		vendAmount: amount,
		commissionRate,
		commissionGained: commissionEarned.toFixed(2),
		referralAmount,
		rewardAmount,
		rewardRate,
		referralRate,
		vasAmount,
	};
}
