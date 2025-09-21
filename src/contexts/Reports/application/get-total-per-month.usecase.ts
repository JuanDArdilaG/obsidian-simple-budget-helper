import { QueryUseCase } from "contexts/Shared/domain";
import { IReportsService, ItemsReport, ReportBalance } from "../domain";

export type GetTotalPerMonthUseCaseInput = {
	report: ItemsReport;
	type: "expenses" | "incomes" | "all";
};
export type GetTotalPerMonthUseCaseOutput = ReportBalance;

export class GetTotalPerMonthUseCase
	implements
		QueryUseCase<
			GetTotalPerMonthUseCaseInput,
			GetTotalPerMonthUseCaseOutput
		>
{
	constructor(private readonly _reportsService: IReportsService) {}

	async execute({
		report,
		type,
	}: GetTotalPerMonthUseCaseInput): Promise<ReportBalance> {
		return await this._reportsService.getTotalPerMonth(report, type);
	}
}
