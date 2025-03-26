import { QueryUseCase } from "contexts/Shared/domain";
import { GroupByYearMonthDay, IReportsService } from "contexts/Reports/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { CategoryID } from "contexts/Categories/domain";
import { AccountID } from "contexts/Accounts/domain";

export type GetAllTransactionsGroupedByDaysUseCaseInput = {
	accountFilter?: AccountID;
	categoryFilter?: CategoryID;
	subCategoryFilter?: SubCategoryID;
};
export type GetAllTransactionsGroupedByDaysUseCaseOutput = GroupByYearMonthDay;

export class GetAllTransactionsGroupedByDaysUseCase
	implements
		QueryUseCase<
			GetAllTransactionsGroupedByDaysUseCaseInput,
			GetAllTransactionsGroupedByDaysUseCaseOutput
		>
{
	constructor(private _reportsService: IReportsService) {}

	async execute({
		accountFilter,
		categoryFilter,
		subCategoryFilter,
	}: GetAllTransactionsGroupedByDaysUseCaseInput): Promise<GroupByYearMonthDay> {
		return await this._reportsService.groupTransactionsByYearMonthDay({
			accountFilter,
			categoryFilter,
			subCategoryFilter,
		});
	}
}
