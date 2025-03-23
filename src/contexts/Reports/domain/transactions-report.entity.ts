import { Logger } from "contexts/Shared/infrastructure/logger";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { GroupByYearMonthDay } from "./reports-service.interface";
import { ReportBalance } from "./report-balance.valueobject";

export class TransactionsReport {
	constructor(private _transactions: Transaction[]) {}

	get transactions(): Transaction[] {
		return this._transactions;
	}

	sortedByDate(direction: "asc" | "desc" = "asc"): TransactionsReport {
		return new TransactionsReport(
			this._transactions.sort((a, b) =>
				direction === "asc"
					? a.date.compare(b.date)
					: b.date.compare(a.date)
			)
		);
	}

	groupByDays(): GroupByYearMonthDay {
		return this._transactions.reduce((group, transaction) => {
			const year = transaction.date.getYear();
			const month = transaction.date.getMonthNameAbbreviation();
			const day = transaction.date.getDay();

			if (!group[year]) group[year] = {};
			if (!group[year][month]) group[year][month] = {};
			if (!group[year][month][day]) group[year][month][day] = [];
			group[year][month][day].push(transaction);

			return group;
		}, {} as GroupByYearMonthDay);
	}

	withAccumulatedBalance(): {
		transaction: Transaction;
		balance: ReportBalance;
	}[] {
		if (!this._transactions.length) return [];

		const sortedReport = this.sortedByDate("asc");

		let accumulated: Record<string, ReportBalance> = {};
		return sortedReport.transactions
			.map((transaction) => {
				if (!accumulated[transaction.account.value])
					accumulated[transaction.account.value] =
						ReportBalance.zero();
				accumulated[transaction.account.value] = accumulated[
					transaction.account.value
				].plus(transaction.realAmount);
				Logger.debug(
					"TransactionReport: accumulating transaction",
					{
						transaction: transaction.toPrimitives(),
						realAmount: transaction.realAmount.valueOf(),
						accumulated,
					},
					{ on: false }
				);
				return {
					transaction,
					balance: accumulated[transaction.account.value],
				};
			})
			.reverse();
	}
}
