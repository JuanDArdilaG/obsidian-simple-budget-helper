import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { SubCategoryID } from "contexts/Subcategories/domain";
import {
	ITransactionsRepository,
	Transaction,
	TransactionCriteria,
} from "contexts/Transactions/domain";

export type GetAllTransactionsUseCaseInput = {
	accountFilter?: AccountID;
	categoryFilter?: CategoryID;
	subCategoryFilter?: SubCategoryID;
};
export type GetAllTransactionsUseCaseOutput = Transaction[];

export class GetAllTransactionsUseCase
	implements
		QueryUseCase<
			GetAllTransactionsUseCaseInput,
			GetAllTransactionsUseCaseOutput
		>
{
	#logger = new Logger("GetAllTransactionsUseCase");
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

		this.#logger.debug("account transactions", {
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

			this.#logger.debug("toAccount transactions", {
				transactions: transactionsToAccount.map((t) =>
					t.toPrimitives()
				),
			});

			transactions.push(...transactionsToAccount);
		}

		return transactions;
	}
}
