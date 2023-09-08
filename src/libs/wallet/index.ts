import { WPUserMeta } from "@models/sql/wallet";
import sequelize from "@connections/mysql";
import { WalletTransaction, TransactionTypes, PaymentStatus } from "@models/walletTransactions";

class Wallet {
	public async transfer(srcUserId: any, dstUserId: any, amount: any, tranRef: string, type: string) {
		try {
			const result = (await sequelize.ActiveConnection).transaction(async (t: any) => {
				const debitResult = await this.debitWallet(srcUserId, amount, t);
				const creditResult = await this.creditWallet(dstUserId, amount, t);
				await WalletTransaction.create({
					refId: tranRef,
					type,
					amount,
					balBefore: type === TransactionTypes.DEBIT ? debitResult.balBefore : creditResult.balBefore,
					balAfter: type === TransactionTypes.DEBIT ? debitResult.balAfter : creditResult.balAfter,
					dstUserId,
					srcUserId,
					status: PaymentStatus.COMPLETED,
				});
			});
			return result;
		} catch (error) {
			console.log("Transfer:Error:", error);
			throw error;
		}
	}

	public async walletBalance(userId: number) {
		try {
			const wpWallets = await WPUserMeta.findOne({
				where: {
					user_id: userId,
					meta_key: "_current_woo_wallet_balance",
				},
				lock: true,
				attributes: ["meta_key", "meta_value"],
			});

			return Number.parseFloat(wpWallets?.dataValues.meta_value);
		} catch (error) {
			console.log("Wallet-Balance:Error:", error);
			throw error;
		}
	}

	public async debitWallet(userId: number, amount: number, transaction = null) {
		let query: any = {
			where: {
				user_id: userId,
				meta_key: "_current_woo_wallet_balance",
			},
			attributes: ["meta_key", "meta_value"],
		};

		if (!!transaction) {
			query = { ...query, transaction, lock: true };
		}
		const srcWallet = await WPUserMeta.findOne(query);
		if (!srcWallet) {
			// Throw wallet not found
			throw new Error("Wallet not found.");
		} else if (Number.parseFloat(srcWallet?.dataValues.meta_value) < amount) {
			// throw insufficent balance.
			throw new Error("Insufficient balance to process this request!");
		} else if (amount <= 0) {
			// throw insufficent balance.
			throw new Error("Amount must be greater than 0");
		} else {
			console.log("DEBIT BEGAN");
			const newBalance = Number.parseFloat(srcWallet?.dataValues.meta_value) - amount;
			await WPUserMeta.update(
				{ meta_value: newBalance },
				{
					where: {
						user_id: userId,
						meta_key: "_current_woo_wallet_balance",
					},
					transaction,
				},
			);
			return {
				balBefore: srcWallet?.dataValues.meta_value,
				balAfter: newBalance,
			};
		}
	}

	public async creditWallet(userId: number, amount: number, transaction = null) {
		let query: any = {
			where: {
				user_id: userId,
				meta_key: "_current_woo_wallet_balance",
			},
			attributes: ["meta_key", "meta_value"],
		};

		if (!!transaction) {
			query = { ...query, transaction, lock: true };
		}
		const dstWallet = await WPUserMeta.findOne(query);
		if (!dstWallet) {
			// Throw wallet not found
			throw new Error("Wallet not found.");
		} else {
			const newBalance = Number.parseFloat(dstWallet?.dataValues.meta_value) + amount;
			await WPUserMeta.update(
				{ meta_value: newBalance },
				{
					where: {
						user_id: userId,
						meta_key: "_current_woo_wallet_balance",
					},
					transaction,
				},
			);
			return {
				balBefore: dstWallet?.dataValues.meta_value,
				balAfter: newBalance,
			};
		}
	}

	public async reverseDebit(tranRef: string): Promise<void> {
		try {
			const transactions = await WalletTransaction.find({
				refId: tranRef,
			});

			if (transactions.length < 1) {
				console.log(`WALLET REVERSAL RESPONSE:Transaction ${tranRef} not found`);
				return;
			}

			if (transactions.length > 1) {
				return;
			} else {
				for (const transaction of transactions) {
					if (transaction.type === "debit") {
						await this.transfer(
							transaction.dstUserId,
							transaction.srcUserId,
							transaction.amount,
							transaction.refId,
							TransactionTypes.REVERSAL,
						);
					}
				}
				return;
			}
		} catch (error) {
			console.log("Reversal:Error:", error);
			throw error;
		}
	}
}
export default new Wallet();
