import { AccountID } from "contexts/Accounts";
import { CategoryID } from "contexts/Categories";
import { Logger } from "contexts/Shared";
import { QueryUseCase } from "contexts/Shared/domain";
import { SubcategoryID } from "contexts/Subcategories";
import {
	ITransactionsRepository,
	Transaction,
	TransactionCriteria,
} from "contexts/Transactions/domain";

const logger = new Logger("GetAllTransactionsUseCase", false);

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

		logger.debug("account transactions", {
			transactions: transactions.map((t) => t.toPrimitives()),
		});

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

			logger.debug("toAccount transactions", {
				transactions: transactionsToAccount.map((t) =>
					t.toPrimitives()
				),
			});

			transactions.push(...transactionsToAccount);
		}

		return transactions;
	}
}
