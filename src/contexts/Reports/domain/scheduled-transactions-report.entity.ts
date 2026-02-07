import { AccountsMap } from "../../Accounts/application/get-all-accounts.usecase";
import { ItemRecurrenceInfo } from "../../ScheduledTransactions/domain";

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
}
