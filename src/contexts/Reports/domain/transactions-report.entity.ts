import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
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

	withAccumulatedBalance(): TransactionWithAccumulatedBalance[] {
		if (!this._transactions.length) return [];

		const sortedReport = this.sortedByDate("asc");

		const accumulated: Record<string, number> = {};

		return sortedReport.transactions
			.map((transaction) => {
				return {
					transaction,
					originAccounts: transaction.originAccounts.map(
						(originAccount) => {
							if (!accumulated[originAccount.account.id.value])
								accumulated[originAccount.account.id.value] = 0;
							const prevBalance =
								accumulated[originAccount.account.id.value];
							accumulated[originAccount.account.id.value] +=
								transaction.getRealAmountForAccount(
									originAccount.account.id,
								).value;
							return {
								account: originAccount.account,
								balance:
									accumulated[originAccount.account.id.value],
								prevBalance,
							};
						},
					),
					destinationAccounts: transaction.destinationAccounts.map(
						(destinationAccount) => {
							if (
								!accumulated[
									destinationAccount.account.id.value
								]
							)
								accumulated[
									destinationAccount.account.id.value
								] = 0;
							const prevBalance =
								accumulated[
									destinationAccount.account.id.value
								];
							accumulated[destinationAccount.account.id.value] +=
								transaction.getRealAmountForAccount(
									destinationAccount.account.id,
								).value;
							return {
								account: destinationAccount.account,
								balance:
									accumulated[
										destinationAccount.account.id.value
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
