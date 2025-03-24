import { AccountID } from "contexts/Accounts";
import { CategoryID } from "contexts/Categories";
import { QueryUseCase } from "contexts/Shared/domain";
import { SubcategoryID } from "contexts/Subcategories";
import {
	ITransactionsRepository,
	Transaction,
	TransactionCriteria,
} from "contexts/Transactions/domain";

export type GetAllTransactionsUseCaseInput = {
	accountFilter?: AccountID;
	categoryFilter?: CategoryID;
	subCategoryFilter?: SubcategoryID;
};
export type GetAllTransactionsUseCaseOutput = Transaction[];

export class GetAllTransactionsUseCase
	implements
		QueryUseCase<
			GetAllTransactionsUseCaseInput,
			GetAllTransactionsUseCaseOutput
		>
{
	constructor(private _transactionsRepository: ITransactionsRepository) {}

	async execute({
		accountFilter,
		categoryFilter,
		subCategoryFilter,
	}: GetAllTransactionsUseCaseInput): Promise<GetAllTransactionsUseCaseOutput> {
		const filterCriteria = new TransactionCriteria();
		if (accountFilter) filterCriteria.where("account", accountFilter.value);

		if (categoryFilter)
			filterCriteria.where("category", categoryFilter.value);

		if (subCategoryFilter)
			filterCriteria.where("subCategory", subCategoryFilter.value);

		let transactions = await this._transactionsRepository.findByCriteria(
			filterCriteria
		);

		if (accountFilter) {
			const filterCriteria = new TransactionCriteria();
			if (accountFilter)
				filterCriteria.where("toAccount", accountFilter.value);

			if (categoryFilter)
				filterCriteria.where("category", categoryFilter.value);

			if (subCategoryFilter)
				filterCriteria.where("subCategory", subCategoryFilter.value);

			const transactionsToAccount =
				await this._transactionsRepository.findByCriteria(
					filterCriteria
				);

			transactions.push(...transactionsToAccount);
		}

		return transactions;
	}
}
