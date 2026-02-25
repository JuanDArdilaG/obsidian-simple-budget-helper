import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { AccountsMap } from "../../Accounts/application/get-all-accounts.usecase";
import { Account } from "../../Accounts/domain";
import { Nanoid } from "../../Shared/domain";

export type GroupByYearMonthDay = {
	[year: number]: {
		[month: string]: {
			[day: number]: Transaction[];
		};
	};
};

export type TransactionWithAccumulatedBalance = {
	transaction: Transaction;
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

export class TransactionsReport {
	constructor(private readonly _transactions: Transaction[]) {}

	get transactions(): Transaction[] {
		return this._transactions;
	}

	onlyIncomes(): TransactionsReport {
		return new TransactionsReport(
			this._transactions.filter((t) => t.operation.isIncome()),
		);
	}

	onlyExpenses(): TransactionsReport {
		return new TransactionsReport(
			this._transactions.filter((t) => t.operation.isExpense()),
		);
	}

	filterByYear(year: number): TransactionsReport {
		return new TransactionsReport(
			this._transactions.filter((t) => t.date.getFullYear() === year),
		);
	}

	filterByMonth(month: number): TransactionsReport {
		return new TransactionsReport(
			this._transactions.filter((t) => t.date.getMonth() === month),
		);
	}

	filterUntilDate(date: Date): TransactionsReport {
		return new TransactionsReport(
			this._transactions.filter(
				(t) => t.date.getTime() <= date.getTime(),
			),
		);
	}

	sortedByDate(direction: "asc" | "desc" = "asc"): TransactionsReport {
		return new TransactionsReport(
			this._transactions.toSorted((a, b) =>
				direction === "asc"
					? a.date.compareTo(b.date)
					: b.date.compareTo(a.date),
			),
		);
	}

	sortedByAmount(direction: "asc" | "desc" = "asc"): TransactionsReport {
		return new TransactionsReport(
			this._transactions.toSorted((a, b) =>
				direction === "asc"
					? AccountSplit.totalAmount(a.originAccounts).compareTo(
							AccountSplit.totalAmount(b.originAccounts),
						)
					: AccountSplit.totalAmount(b.originAccounts).compareTo(
							AccountSplit.totalAmount(a.originAccounts),
						),
			),
		);
	}

	groupByDays(): GroupByYearMonthDay {
		return this._transactions.reduce((group, transaction) => {
			const year = transaction.date.getFullYear();
			const month = transaction.date.getMonthNameAbbreviation();
			const day = transaction.date.getDay();

			if (!group[year]) group[year] = {};
			if (!group[year][month]) group[year][month] = {};
			if (!group[year][month][day]) group[year][month][day] = [];
			group[year][month][day].push(transaction);

			return group;
		}, {} as GroupByYearMonthDay);
	}

	withAccumulatedBalance(
		accountsMap: AccountsMap,
	): TransactionWithAccumulatedBalance[] {
		if (!this._transactions.length) return [];

		const sortedReport = this.sortedByDate("asc");

		const accumulated: Record<string, number> = {};

		return sortedReport.transactions
			.map((transaction) => {
				return {
					transaction,
					originAccounts: transaction.originAccounts.map(
						(originAccount) => {
							const account = accountsMap.get(
								originAccount.accountId.value,
							);
							if (!account) {
								throw new Error(
									`Account with ID ${originAccount.accountId.value} not found in accounts map`,
								);
							}
							if (!accumulated[originAccount.accountId.value])
								accumulated[originAccount.accountId.value] = 0;
							const prevBalance =
								accumulated[originAccount.accountId.value];
							accumulated[originAccount.accountId.value] +=
								transaction.getRealAmountForAccount(
									new Nanoid(originAccount.accountId.value),
								).value;
							return {
								account,
								balance:
									accumulated[originAccount.accountId.value],
								prevBalance,
							};
						},
					),
					destinationAccounts: transaction.destinationAccounts.map(
						(destinationAccount) => {
							const account = accountsMap.get(
								destinationAccount.accountId.value,
							);
							if (!account) {
								throw new Error(
									`Account with ID ${destinationAccount.accountId.value} not found in accounts map`,
								);
							}
							if (
								!accumulated[destinationAccount.accountId.value]
							)
								accumulated[
									destinationAccount.accountId.value
								] = 0;
							const prevBalance =
								accumulated[destinationAccount.accountId.value];
							accumulated[destinationAccount.accountId.value] +=
								transaction.getRealAmountForAccount(
									new Nanoid(
										destinationAccount.accountId.value,
									),
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

	totalAssetsUntilMonth(month: number, year: number): number {
		const transactionsUntilMonth = this._transactions.filter((t) => {
			const tYear = t.date.getFullYear();
			const tMonth = t.date.getMonth();
			return tYear < year || (tYear === year && tMonth <= month);
		});

		const reportUntilMonth = new TransactionsReport(transactionsUntilMonth);

		return (
			reportUntilMonth.onlyIncomes()._transactions.reduce((total, t) => {
				return (
					total + t.getRealAmountForAccount(new Nanoid("any")).value
				);
			}, 0) -
			reportUntilMonth.onlyExpenses()._transactions.reduce((total, t) => {
				return (
					total + t.getRealAmountForAccount(new Nanoid("any")).value
				);
			}, 0)
		);
	}
}
