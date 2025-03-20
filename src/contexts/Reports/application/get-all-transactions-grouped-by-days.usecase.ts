import { QueryUseCase } from "contexts/Shared/domain";
import { GroupByYearMonthDay, IReportsService } from "contexts/Reports/domain";

export type GetAllTransactionsGroupedByDaysUseCaseOutput = GroupByYearMonthDay;

export class GetAllTransactionsGroupedByDaysUseCase
	implements
		QueryUseCase<undefined, GetAllTransactionsGroupedByDaysUseCaseOutput>
{
	constructor(private _reportsService: IReportsService) {}

	async execute(): Promise<GroupByYearMonthDay> {
		return this._reportsService.groupTransactionsByYearMonthDay();
	}
}
