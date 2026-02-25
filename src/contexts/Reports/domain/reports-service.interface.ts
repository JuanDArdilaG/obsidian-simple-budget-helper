import { AccountsMap } from "../../Accounts/application/get-all-accounts.usecase";
import { ReportBalance } from "./report-balance.valueobject";
import { ScheduledMonthlyReport } from "./scheduled-monthly-report.entity";

export interface IReportsService {
	getTotalPerMonth(
		accountsMap: AccountsMap,
		report: ScheduledMonthlyReport,
		type: "expenses" | "incomes" | "all",
	): Promise<ReportBalance>;

	/**
	 * Calculates the accumulated total of the report
	 * @param report the report
	 * @param type the type of transactions to calculate (if null calculates all transactions)
	 */
	getTotal(
		accountsMap: AccountsMap,
		report: ScheduledMonthlyReport,
		type?: "expenses" | "incomes",
	): Promise<ReportBalance>;
}
