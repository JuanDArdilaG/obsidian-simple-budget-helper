import { CategoryID } from "contexts/Categories/domain";
import { Nanoid, QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { SubCategoryID } from "contexts/Subcategories/domain";
import {
	ITransactionsRepository,
	Transaction,
	TransactionCriteria,
} from "contexts/Transactions/domain";

export type GetAllTransactionsUseCaseInput = {
	accountFilter?: Nanoid;
	categoryFilter?: CategoryID;
	subCategoryFilter?: SubCategoryID;
};
export type GetAllTransactionsUseCaseOutput = Transaction[];

export class GetAllTransactionsUseCase implements QueryUseCase<
	GetAllTransactionsUseCaseInput,
	GetAllTransactionsUseCaseOutput
> {
	#logger = new Logger("GetAllTransactionsUseCase");
	constructor(private _transactionsRepository: ITransactionsRepository) {}

	async execute({
		accountFilter,
		categoryFilter,
		subCategoryFilter,
	}: GetAllTransactionsUseCaseInput): Promise<GetAllTransactionsUseCaseOutput> {
		// Get all transactions first
		const allTransactions =
			await this._transactionsRepository.findByCriteria(
				new TransactionCriteria(),
			);

		// Filter transactions based on the provided filters
		let filteredTransactions = allTransactions;

		// Filter by category
		if (categoryFilter) {
			filteredTransactions = filteredTransactions.filter((transaction) =>
				transaction.category.equalTo(categoryFilter),
			);
		}

		// Filter by subcategory
		if (subCategoryFilter) {
			filteredTransactions = filteredTransactions.filter((transaction) =>
				transaction.subCategory.equalTo(subCategoryFilter),
			);
		}

		// Filter by account - check if the account appears in either fromSplits or toSplits
		if (accountFilter) {
			filteredTransactions = filteredTransactions.filter(
				(transaction) => {
					const fromAccountIds = transaction.originAccounts.map(
						(split) => split.accountId,
					);
					const toAccountIds = transaction.destinationAccounts.map(
						(split) => split.accountId,
					);
					const allAccountIds = [...fromAccountIds, ...toAccountIds];

					return allAccountIds.some((accountId) =>
						accountId.equalTo(accountFilter),
					);
				},
			);
		}

		this.#logger.debug("filtered transactions", {
			accountFilter: accountFilter?.value,
			categoryFilter: categoryFilter?.value,
			subCategoryFilter: subCategoryFilter?.value,
			totalTransactions: allTransactions.length,
			filteredTransactions: filteredTransactions.length,
			transactions: filteredTransactions.map((t) => t.toPrimitives()),
		});

		return filteredTransactions;
	}
}
