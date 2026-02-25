import { AccountsMap } from "../../Accounts/application/get-all-accounts.usecase";
import { Account } from "../../Accounts/domain";
import { ItemRecurrenceInfo } from "../../ScheduledTransactions/domain";

export type ScheduledTransactionWithAccumulatedBalance = {
	recurrence: ItemRecurrenceInfo;
	originAccounts: {
		account: Account;
		balance: number;
		prevBalance: number;
	}[];
	destinationAccounts?: {
		account: Account;
		balance: number;
		prevBalance: number;
	}[];
};

export class ScheduledTransactionsReport {
	constructor(private readonly _recurrences: ItemRecurrenceInfo[]) {}

	get recurrences(): ItemRecurrenceInfo[] {
		return this._recurrences;
	}

	onlyIncomes(accountsMap: AccountsMap): ScheduledTransactionsReport {
		return new ScheduledTransactionsReport(
			this._recurrences.filter((t) => {
				if (t.operation.type.isIncome()) return true;
				if (t.operation.type.isTransfer()) {
					const originAccount = accountsMap.get(
						t.originAccounts[0].accountId.value,
					);
					const destinationAccount = accountsMap.get(
						t.destinationAccounts[0].accountId.value,
					);
					if (!originAccount || !destinationAccount) return false;
					if (
						originAccount.type.isLiability() &&
						destinationAccount.type.isAsset()
					) {
						return true;
					}
					return false;
				}
			}),
		);
	}

	onlyExpenses(accountsMap: AccountsMap): ScheduledTransactionsReport {
		return new ScheduledTransactionsReport(
			this._recurrences.filter((t) => {
				if (t.operation.type.isExpense()) return true;
				if (t.operation.type.isTransfer()) {
					const originAccount = accountsMap.get(
						t.originAccounts[0].accountId.value,
					);
					const destinationAccount = accountsMap.get(
						t.destinationAccounts[0].accountId.value,
					);
					if (!originAccount || !destinationAccount) return false;
					if (
						originAccount.type.isAsset() &&
						destinationAccount.type.isLiability()
					) {
						return true;
					}
					return false;
				}
			}),
		);
	}

	getTotalAmount(accountsMap: AccountsMap): number {
		return this._recurrences.reduce((total, rec) => {
			if (rec.operation.type.isTransfer()) {
				const originAccount = accountsMap.get(
					rec.originAccounts[0].accountId.value,
				);
				const destinationAccount = accountsMap.get(
					rec.destinationAccounts[0].accountId.value,
				);
				if (!originAccount || !destinationAccount) return total;
				if (
					originAccount.type.isLiability() &&
					destinationAccount.type.isAsset()
				) {
					return total + rec.originAmount.value; // Treat as income
				}
				if (
					originAccount.type.isAsset() &&
					destinationAccount.type.isLiability()
				) {
					return total - rec.originAmount.value; // Treat as expense
				}
				return total; // Ignore transfers between assets or between liabilities
			}
			return total + rec.effectiveAmount.value;
		}, 0);
	}

	withAccumulatedBalance(
		accountsMap: AccountsMap,
	): ScheduledTransactionWithAccumulatedBalance[] {
		if (!this._recurrences.length) return [];

		const sortedRecurrences = [...this._recurrences].sort((a, b) =>
			a.date.compareTo(b.date),
		);

		const accumulated: Record<string, number> = {};

		// Initialize accumulated balances with current account balances
		accountsMap.forEach((account) => {
			accumulated[account.id] = account.balance.value.value;
		});

		return sortedRecurrences
			.map((recurrence) => {
				return {
					recurrence,
					originAccounts: recurrence.originAccounts.map(
						(originAccount) => {
							const account = accountsMap.get(
								originAccount.accountId.value,
							);
							if (!account) {
								throw new Error(
									`Account with ID ${originAccount.accountId.value} not found in accounts map`,
								);
							}
							// Initialize with current balance if not yet set
							accumulated[originAccount.accountId.value] ??= account.balance.value.value;
							const prevBalance =
								accumulated[originAccount.accountId.value];
							accumulated[originAccount.accountId.value] +=
								recurrence.getRealPriceForAccount(
									recurrence.operation,
									account,
									recurrence.originAccounts,
									recurrence.destinationAccounts,
								).value;
							return {
								account,
								balance:
									accumulated[originAccount.accountId.value],
								prevBalance,
							};
						},
					),
					destinationAccounts: recurrence.destinationAccounts.map(
						(destinationAccount) => {
							const account = accountsMap.get(
								destinationAccount.accountId.value,
							);
							if (!account) {
								throw new Error(
									`Account with ID ${destinationAccount.accountId.value} not found in accounts map`,
								);
							}
							// Initialize with current balance if not yet set
							accumulated[destinationAccount.accountId.value] ??= account.balance.value.value;
							const prevBalance =
								accumulated[destinationAccount.accountId.value];
							accumulated[destinationAccount.accountId.value] +=
								recurrence.getRealPriceForAccount(
									recurrence.operation,
									account,
									recurrence.originAccounts,
									recurrence.destinationAccounts,
								).value;
							return {
								account,
								balance:
									accumulated[
										destinationAccount.accountId.value
									],
								prevBalance,
							};
						},
					),
				};
			})
			.reverse();
	}
}
