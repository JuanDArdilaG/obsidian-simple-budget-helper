import { QueryUseCase } from "contexts/Shared/domain";
import { IReportsService, ItemsReport, ReportBalance } from "../domain";

export type GetTotalUseCaseInput = {
	report: ItemsReport;
	type?: "expenses" | "incomes";
};
export type GetTotalUseCaseOutput = ReportBalance;

export class GetTotalUseCase
	implements QueryUseCase<GetTotalUseCaseInput, GetTotalUseCaseOutput>
{
	constructor(private readonly _reportsService: IReportsService) {}

	async execute({
		report,
		type,
	}: GetTotalUseCaseInput): Promise<ReportBalance> {
		return await this._reportsService.getTotal(report, type);
	}
}
