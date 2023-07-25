import { WP_USERMETA } from "@models/sql/wallet";
import sequelize from "@connections/mysql";
import { WalletTransaction, TransactionTypes, PaymentStatus } from "@models/walletTransactions";

class Wallet {
	public async transfer(srcUserId: any, dstUserId: any, amount: any, tranRef: string, type: string) {
		console.log("TRANSFER PAYLOAD", srcUserId, dstUserId, amount);
		try {
			const result = (await sequelize.ActiveConnection).transaction(async (t: any) => {
				const debitResult = await this.debitWallet(srcUserId, amount, t);
				console.log("DEBIT RESULT IS HERE", debitResult);
				const creditResult = await this.creditWallet(dstUserId, amount, t);
				console.log("CREDIT RESULT IS HERE", creditResult);
				await WalletTransaction.create({
					refId: tranRef,
					type: type,
					amount: amount,
					balBefore: type === TransactionTypes.DEBIT ? debitResult.balBefore : creditResult.balBefore,
					balAfter: type === TransactionTypes.DEBIT ? debitResult.balAfter : creditResult.balAfter,
					dstUserId: dstUserId,
					srcUserId: srcUserId,
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
			const wp_wallets = await WP_USERMETA.findOne({
				where: {
					user_id: userId,
					meta_key: "_current_woo_wallet_balance",
				},
				lock: true,
				attributes: ["meta_key", "meta_value"],
			});
			console.log("ALL WP WALLETS", wp_wallets?.dataValues);

			return Number.parseFloat(wp_wallets?.dataValues.meta_value);
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
		const srcWallet = await WP_USERMETA.findOne(query);
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
			await WP_USERMETA.update(
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
		const dstWallet = await WP_USERMETA.findOne(query);
		if (!dstWallet) {
			// Throw wallet not found
			throw new Error("Wallet not found.");
		} else {
			const newBalance = Number.parseFloat(dstWallet?.dataValues.meta_value) + amount;
			await WP_USERMETA.update(
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

	public async reverseDebit(tranRef: string) {
		try {
			const transaction = await WalletTransaction.findOne({
				refId: tranRef,
			});

			if (!transaction) {
				throw new Error("Transaction not found");
			}

			await this.transfer(
				transaction.dstUserId,
				transaction.srcUserId,
				transaction.amount,
				transaction.refId,
				TransactionTypes.REVERSAL,
			);
		} catch (error) {
			console.log("Reversal:Error:", error);
			throw error;
		}
	}
}
export default new Wallet();
