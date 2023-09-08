import { MySQL } from "@config";
import { ValidationError, AppError, ServiceUnavailableError, BadRequestError } from "@components/errors";
import { Offering, IOffering, DocumentType, Order, OrderStatus, Payment, PaymentStatus } from "@models";
import { findOfferingHandler, FulfillmentRequestData, PaidOfferingHandler } from "../modules/offerings";
import { PaymentMethods } from "@components/enums";
import Ewallet from "@libs/wallet";
import { TransactionTypes } from "@models/walletTransactions";
import { listSources } from "@modules/lists";
import { CashtokenBundles } from "@models/cashtokenBundles";
import * as Interface from "@libs/WPCore/interfaces";
import { List } from "@api/validators";

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
	vasAmount?: string;
	vasRate?: string;
}
interface BundlePriceListing {
	[x: string]: {
		utility: string;
		cashtoken: string;
		price: string;
	};
}

interface Utility {
	provider: string;
	product: string;
	code: string;
}

export enum products {
	UTILITYBUNDLE = "utilitybundle",
	AIRTIME = "airtime",
	DATABUNDLE = "databundle",
	ELECTRICITY = "electricity",
}

async function getHandler(offering: DocumentType<IOffering>) {
	const Handler = (await findOfferingHandler(offering.name)) as typeof PaidOfferingHandler;
	return Handler;
}

async function merchantCanVendService(
	user: Interface.Data,
	offering: string,
	productType: string,
): Promise<RefactoredSchema & Partial<{ bundlePriceListing: BundlePriceListing } & { utility: Utility }>> {
	let serviceCommission: RefactoredSchema & Partial<{ bundlePriceListing: BundlePriceListing } & { utility: Utility }> = {};
	if (offering === products.UTILITYBUNDLE) {
		const utilityType = await CashtokenBundles.findByCode(Number(productType));
		if (!utilityType) {
			throw new BadRequestError(`Invalid providedType provided(${productType})`);
		}
		const bundlePriceListing = await listSources.cashtokenBundleProviders({ provider_code: productType }, user.token);
		serviceCommission = Object.assign(serviceCommission, { bundlePriceListing, utility: utilityType });
		offering = utilityType.product.toLowerCase();
		productType = utilityType.provider.toLowerCase();
	}
	// return;
	const { commissions } = user;
	const merchantAvailableServices = commissions[offering];
	if (!merchantAvailableServices || !merchantAvailableServices[productType]) {
		throw new BadRequestError(`You do not have authorization to vend the provided service(${productType})`);
	}
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
	return serviceCommission;
}

export async function fulfill(data: FulfillmentRequestData, user: Interface.Data) {
	try {
		console.log("______New Offline Pay request", data);
		// Retrieve merchant commission configuration
		const commissions = await merchantCanVendService(user, data.params.productName, data.params.productType.toLowerCase());
		data.params.utility = commissions.utility;
		const service = await Offering.findByName(data.params.productName);
		const Handler = await getHandler(service);
		// return;
		const handler = new Handler(data);
		const { source, params } = handler.data;
		const txnRef = source.sessionId;
		const transRefExist = await Order.findOne({ "source.sessionId": txnRef });
		console.log("___________Check OrderTransRef", transRefExist);
		if (transRefExist) {
			throw new ValidationError("Transaction reference already exists");
		}
		const amount = await getOrderAmount(params.productName, handler.data, params?.productType || null);
		let commissionCalculated: RefactoredSchema;
		if (commissions.bundlePriceListing) {
			const utilityBundleCalculator = utilityBundlePriceCalculator(amount, commissions.bundlePriceListing as BundlePriceListing);
			commissionCalculated = calculateCommission(
				utilityBundleCalculator.vasAmount,
				commissions.discount as string,
				commissions.referralRate as string,
			);
			commissionCalculated.rewardAmount = utilityBundleCalculator.rewardAmount;
			commissionCalculated.rewardRate = utilityBundleCalculator.rewardRate;
			commissionCalculated.vasRate = String(utilityBundleCalculator.utitlityRate);
		} else {
			commissionCalculated = calculateCommission(
				amount,
				commissions.discount as string,
				commissions.referralRate as string,
				commissions.rewardRate as string,
			);
		}
		// return;
		await Ewallet.transfer(user.id, MySQL.systemUser, Number.parseFloat(amount), txnRef, TransactionTypes.DEBIT);
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
		return artifact;
	} catch (error: any) {
		await Ewallet.reverseDebit(data.source.sessionId);
		console.error("CONTROLLER ERROR HANDLER", error);
		if (error instanceof AppError) {
			throw error;
		} else {
			throw new ServiceUnavailableError("Unable to complete request", error);
		}
	}
}

async function getOrderAmount(productName: string, data: FulfillmentRequestData, productType: string | null = null) {
	const offerings = await listSources.offerings();
	const exempted = ["airtime", "electricity", "utilitybundle"];
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
			} else if (Object.keys(dataBundles).length > 0) {
				throw new BadRequestError("Invalid provider code provided");
			} else {
				throw new Error("Unable to retrieve databundle. Please try again");
			}
		case "cabletv":
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
			} else if (Object.keys(bouquets).length > 0) {
				throw new BadRequestError("Invalid provider code provided");
			} else {
				throw new ServiceUnavailableError("Unable to retrieve bouquets. Please try again");
			}
	}
}

function calculateCommission(amount: string, commissionRate: string, referralRate = "0.00", rewardRate = "0.00") {
	const commissionGained = Number(amount) * (Number(commissionRate) / 100);
	let referralAmount = "0.00";
	let rewardAmount = "0.00";
	if (Number(commissionGained) > 0) {
		referralAmount = (commissionGained * (Number(referralRate) / 100)).toFixed(2);
		rewardAmount = (commissionGained * (Number(rewardRate) / 100)).toFixed(2);
	}
	const commissionEarned = Number(commissionGained) - (Number(referralAmount) + Number(rewardAmount));
	const vasAmount = (Number(amount) - commissionGained).toFixed(2);

	return {
		vendAmount: amount,
		commissionRate,
		commissionGained: commissionEarned.toFixed(2),
		referralAmount,
		rewardAmount,
		rewardRate,
		referralRate,
		vasAmount,
		vasRate: (100 - Number(rewardRate)).toFixed(2),
	};
}

function utilityBundlePriceCalculator(amount: string | number, bundlePriceListing: BundlePriceListing) {
	let selectedPrice = null;
	let extraAmount = 0;
	if (!bundlePriceListing[amount] && Object.keys(bundlePriceListing).length > 1) {
		const priceListing = Object.keys(bundlePriceListing)
			.map((element) => Number(element))
			.sort((a, b) => a - b);
		const loweBound = priceListing[0];
		const upperBound = priceListing[priceListing.length - 1];
		amount = Number(amount);
		if (amount < loweBound) {
			throw new BadRequestError(`Invalid amount(${amount}) provided. Amount must be one of ${priceListing}`);
		}

		if (amount > upperBound) {
			extraAmount = amount - upperBound;
			selectedPrice = bundlePriceListing[String(upperBound)];
		}
	} else if (Object.keys(bundlePriceListing).length === 1) {
		selectedPrice = bundlePriceListing[Object.keys(bundlePriceListing)[0]];
	}
	selectedPrice = bundlePriceListing[amount];
	const price = Number(selectedPrice.price);
	const rewardRate = Number(selectedPrice.cashtoken);
	const utitlityRate = Number(selectedPrice.utility);
	const rewardAmount = (price * (rewardRate / 100)).toFixed(2);
	const vasAmount = (price * (utitlityRate / 100) + extraAmount).toFixed(2);

	return {
		vasAmount,
		rewardAmount,
		utitlityRate,
		rewardRate: String(rewardRate),
	};
}
