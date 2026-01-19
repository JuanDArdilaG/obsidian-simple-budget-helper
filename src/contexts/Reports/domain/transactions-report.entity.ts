import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { Nanoid } from "../../Shared/domain";
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
	accounts: {
		id: Nanoid;
		balance: ReportBalance;
		prevBalance: ReportBalance;
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
					? PaymentSplit.totalAmount(a.originAccounts).compareTo(
							PaymentSplit.totalAmount(b.originAccounts),
						)
					: PaymentSplit.totalAmount(b.originAccounts).compareTo(
							PaymentSplit.totalAmount(a.originAccounts),
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

		const accumulated: Record<string, ReportBalance> = {};
		return sortedReport.transactions
			.flatMap((transaction) => {
				const transactions: TransactionWithAccumulatedBalance[] = [];

				// For transfer transactions, create separate entries for from and to accounts
				if (transaction.operation.isTransfer()) {
					transactions.push(
						{
							transaction,
							accounts: transaction.originAccounts.map(
								(split) => {
									const accountID = split.accountId.value;
									if (!accumulated[accountID])
										accumulated[accountID] =
											new ReportBalance(0);
									const prevBalance = accumulated[accountID];
									accumulated[accountID] = accumulated[
										accountID
									].plus(
										transaction.getRealAmountForAccount(
											split.accountId,
										),
									);
									return {
										id: split.accountId,
										balance:
											accumulated[split.accountId.value],
										prevBalance,
									};
								},
							),
						},
						{
							transaction,
							accounts: transaction.destinationAccounts.map(
								(toSplit) => {
									const accountID = toSplit.accountId.value;
									if (!accumulated[accountID])
										accumulated[accountID] =
											new ReportBalance(0);
									const prevBalance = accumulated[accountID];
									accumulated[accountID] = accumulated[
										accountID
									].plus(
										transaction.getRealAmountForAccount(
											toSplit.accountId,
										),
									);
									return {
										id: toSplit.accountId,
										balance: accumulated[accountID],
										prevBalance,
									};
								},
							),
						},
					);
				} else {
					// For non-transfer transactions, use the original logic
					const allAccountIDs = [
						...transaction.originAccounts.map(
							(s) => s.accountId.value,
						),
						...transaction.destinationAccounts.map(
							(s) => s.accountId.value,
						),
					];
					const uniqueAccountIDs = Array.from(new Set(allAccountIDs));
					transactions.push({
						transaction,
						accounts: uniqueAccountIDs.map((accountId) => {
							if (!accumulated[accountId])
								accumulated[accountId] = new ReportBalance(0);
							const prevBalance = accumulated[accountId];
							accumulated[accountId] = accumulated[
								accountId
							].plus(
								transaction.getRealAmountForAccount(
									new Nanoid(accountId),
								),
							);
							return {
								id: new Nanoid(accountId),
								balance: accumulated[accountId],
								prevBalance,
							};
						}),
					});
				}

				return transactions;
			})
			.reverse();
	}
}
