import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { ReportBalance } from "./report-balance.valueobject";
import { ItemsReport } from "./items-report.entity";

export type GroupByYearMonthDay = {
	[year: number]: {
		[month: string]: {
			[day: number]: Transaction[];
		};
	};
};

export interface IReportsService {
	getTotalPerMonth(
		report: ItemsReport,
		type: "expenses" | "incomes" | "all"
	): Promise<ReportBalance>;

	/**
	 * Calculates the accumulated total of the report
	 * @param report the report
	 * @param type the type of transactions to calculate (if null calculates all transactions)
	 */
	getTotal(
		report: ItemsReport,
		type?: "expenses" | "incomes"
	): Promise<ReportBalance>;
}
