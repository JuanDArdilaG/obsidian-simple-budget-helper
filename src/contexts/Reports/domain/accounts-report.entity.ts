import { Account } from "contexts/Accounts/domain";
import { TransactionsReport } from "./transactions-report.entity";

export class AccountsReport {
	constructor(private readonly _accounts: Account[]) {}

	getAssets(): Account[] {
		return this._accounts.filter((acc) => acc.type.isAsset());
	}

	getLiabilities(): Account[] {
		return this._accounts.filter((acc) => acc.type.isLiability());
	}

	getTotalForAssets(): number {
		return this.getAssets().reduce(
			(total, acc) => total + acc.convertedBalance,
			0,
		);
	}

	getTotalForLiabilities(): number {
		return this.getLiabilities().reduce(
			(total, acc) => total + acc.convertedBalance,
			0,
		);
	}

	getTotal(): number {
		return this.getTotalForAssets() - this.getTotalForLiabilities();
	}

	getTotalAssetsUntilDate(
		transactions: TransactionsReport,
		date: Date,
	): number {
		const filteredTransactions = transactions.filterUntilDate(date);
		const assetsAccountsIds = this.getAssets().map((acc) => acc.nanoid);

		const totalAssets = filteredTransactions.transactions.reduce(
			(total, transaction) => {
				return (
					total +
					assetsAccountsIds.reduce((accSum, accountId) => {
						return (
							accSum +
							transaction.getRealAmountForAccount(accountId).value
						);
					}, 0)
				);
			},
			0,
		);

		return totalAssets;
	}

	getTotalLiabilitiesUntilDate(
		transactions: TransactionsReport,
		date: Date,
	): number {
		const filteredTransactions = transactions.filterUntilDate(date);
		const liabilitiesAccountsIds = this.getLiabilities().map(
			(acc) => acc.nanoid,
		);

		const totalLiabilities = filteredTransactions.transactions.reduce(
			(total, transaction) => {
				return (
					total +
					liabilitiesAccountsIds.reduce((accSum, accountId) => {
						return (
							accSum +
							transaction.getRealAmountForAccount(accountId).value
						);
					}, 0)
				);
			},
			0,
		);

		return -totalLiabilities;
	}
}
