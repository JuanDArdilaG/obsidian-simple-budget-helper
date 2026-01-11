import { ReportBalance } from "./report-balance.valueobject";
import { ScheduledMonthlyReport } from "./scheduled-monthly-report.entity";

export interface IReportsService {
	getTotalPerMonth(
		report: ScheduledMonthlyReport,
		type: "expenses" | "incomes" | "all"
	): Promise<ReportBalance>;

	/**
	 * Calculates the accumulated total of the report
	 * @param report the report
	 * @param type the type of transactions to calculate (if null calculates all transactions)
	 */
	getTotal(
		report: ScheduledMonthlyReport,
		type?: "expenses" | "incomes"
	): Promise<ReportBalance>;
}
