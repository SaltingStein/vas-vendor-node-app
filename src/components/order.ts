export enum OrderStatus {
	COMPLETED = "completed",
	PENDING = "pending",
	PROCESSING = "processing",
	FAILED = "failed",
}

// export enum Providers {
// 	ELECTRICITY = "";
// }

export interface Commissions {
	rebateValue: number;
	rebateFactor: number;
	rewardFactor?: number;
	rewardValue?: number;
	mobileNumber?: string;
}

export interface OrderData {
	description: string;
	merchnatId: string;
	orderId?: number;
	productName: string;
	productType: string;
	providerCode: string;
	providerId: string;
	provider?: string;
	merchantRef: string;
	transactionRef?: string;
	note?: string;
	amount: number;
	commissions?: Commissions;
	artifact?: object | null;
	failureReason?: object | null;
	additionalParams?: object | null;
	status: OrderStatus;
}

export class IOrder implements OrderData {
	public description!: string;
	public merchnatId!: string;
	public orderId?: number;
	public productName!: string;
	public productType!: string;
	public providerCode!: string;
	public providerId!: string;
	public provider?: string;
	public merchantRef!: string;
	public transactionRef?: string;
	public note?: string;
	public amount!: number;
	public commissions?: Commissions;
	public artifact?: object | null;
	public failureReason?: object | null;
	public additionalParams?: object | null;
	public status!: OrderStatus;

	constructor(
		description: string,
		merchantId: string,
		productName: string,
		productType: string,
		providerCode: string,
		providerId: string,
		merchantRef: string,
		amount: number,
		status: OrderStatus,
	) {
		this.description = description;
		this.merchnatId = merchantId;
		this.productName = productName;
		this.productType = productType;
		this.providerCode = providerCode;
		this.providerId = providerId;
		this.merchantRef = merchantRef;
		this.amount = amount;
		this.status = status;
	}
}
