import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { ReportBalance } from "./report-balance.valueobject";

export type GroupByYearMonthDay = {
	[year: number]: {
		[month: string]: {
			[day: number]: Transaction[];
		};
	};
};

export type TransactionWithAccumulatedBalance = {
	transaction: Transaction;
	balance: ReportBalance;
	prevBalance: ReportBalance;
};

export class TransactionsReport {
	constructor(private readonly _transactions: Transaction[]) {}

	get transactions(): Transaction[] {
		return this._transactions;
	}

	onlyIncomes(): TransactionsReport {
		return new TransactionsReport(
			this._transactions.filter((t) => t.operation.isIncome())
		);
	}

	onlyExpenses(): TransactionsReport {
		return new TransactionsReport(
			this._transactions.filter((t) => t.operation.isExpense())
		);
	}

	filterByYear(year: number): TransactionsReport {
		return new TransactionsReport(
			this._transactions.filter((t) => t.date.getFullYear() === year)
		);
	}

	filterByMonth(month: number): TransactionsReport {
		return new TransactionsReport(
			this._transactions.filter((t) => t.date.getMonth() === month)
		);
	}

	sortedByDate(direction: "asc" | "desc" = "asc"): TransactionsReport {
		return new TransactionsReport(
			this._transactions.toSorted((a, b) =>
				direction === "asc"
					? a.date.compareTo(b.date)
					: b.date.compareTo(a.date)
			)
		);
	}

	sortedByAmount(direction: "asc" | "desc" = "asc"): TransactionsReport {
		return new TransactionsReport(
			this._transactions.toSorted((a, b) =>
				direction === "asc"
					? a.amount.compareTo(b.amount)
					: b.amount.compareTo(a.amount)
			)
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

		const accumulated: Record<string, ReportBalance> = {};
		return sortedReport.transactions
			.map((transaction) => {
				const transactions: TransactionWithAccumulatedBalance[] = [];
				if (!accumulated[transaction.account.value])
					accumulated[transaction.account.value] =
						ReportBalance.zero();
				const prevBalance = accumulated[transaction.account.value];
				accumulated[transaction.account.value] = accumulated[
					transaction.account.value
				].plus(
					transaction.getRealAmountForAccount(transaction.account)
				);
				transactions.push({
					transaction,
					balance: accumulated[transaction.account.value],
					prevBalance,
				});
				if (
					transaction.operation.isTransfer() &&
					transaction.toAccount
				) {
					if (!accumulated[transaction.toAccount.value])
						accumulated[transaction.toAccount.value] =
							ReportBalance.zero();
					const prevBalance =
						accumulated[transaction.toAccount.value];
					accumulated[transaction.toAccount.value] = accumulated[
						transaction.toAccount.value
					].plus(
						transaction.getRealAmountForAccount(
							transaction.toAccount
						)
					);
					transactions.push({
						transaction: transaction.copyWithNegativeAmount(),
						balance: accumulated[transaction.toAccount.value],
						prevBalance,
					});
				}
				return transactions;
			})
			.flat()
			.reverse();
	}
}
