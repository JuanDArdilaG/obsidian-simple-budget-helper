import { Nanoid, QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { GetAllAccountsUseCase } from "../../Accounts/application/get-all-accounts.usecase";
import {
	TransactionsReport,
	TransactionWithAccumulatedBalance,
} from "../../Reports/domain";
import { GetAllTransactionsUseCase } from "./get-all-transactions.usecase";

export type TransactionsPagination = {
	page: number;
	pageSize: number;
	searchQuery?: string;
	selectedAccounts?: Nanoid[];
	selectedCategory?: string;
	selectedSubcategory?: string;
};

export type TransactionsWithPagination = {
	transactions: TransactionWithAccumulatedBalance[];
	totalCount: number;
	totalPages: number;
};

export class GetTransactionsWithPagination implements QueryUseCase<
	TransactionsPagination,
	TransactionsWithPagination
> {
	static readonly #logger = new Logger("GetTransactionsWithPagination");
	constructor(
		private readonly getAllTransactionsUseCase: GetAllTransactionsUseCase,
		private readonly getAllAccountsUseCase: GetAllAccountsUseCase,
	) {}

	async execute({
		page,
		pageSize,
		searchQuery,
		selectedAccounts,
		selectedCategory,
		selectedSubcategory,
	}: TransactionsPagination): Promise<TransactionsWithPagination> {
		GetTransactionsWithPagination.#logger.debug(
			"Fetching transactions with pagination",
		);
		const allTransactions = await this.getAllTransactionsUseCase.execute();
		const transactionsReport = new TransactionsReport(allTransactions);
		const accounts = await this.getAllAccountsUseCase.execute();
		const transactionsWithBalances =
			transactionsReport.withAccumulatedBalance(accounts);
		let filteredTransactions = this.#filterBySearchQuery(
			transactionsWithBalances,
			searchQuery,
		);
		filteredTransactions = this.#filterByAccounts(
			filteredTransactions,
			selectedAccounts,
		);
		filteredTransactions = this.#filterByCategory(
			filteredTransactions,
			selectedCategory,
		);
		filteredTransactions = this.#filterBySubcategory(
			filteredTransactions,
			selectedSubcategory,
		);

		const startIndex = (page - 1) * pageSize;
		if (startIndex >= filteredTransactions.length) {
			return {
				transactions: [],
				totalCount: filteredTransactions.length,
				totalPages: Math.ceil(filteredTransactions.length / pageSize),
			};
		}
		const endIndex = startIndex + pageSize;
		return {
			transactions: filteredTransactions.slice(startIndex, endIndex),
			totalCount: filteredTransactions.length,
			totalPages: Math.ceil(filteredTransactions.length / pageSize),
		};
	}

	#filterBySearchQuery(
		transactions: TransactionWithAccumulatedBalance[],
		searchQuery?: string,
	): TransactionWithAccumulatedBalance[] {
		if (!searchQuery) return transactions;
		const lowerCaseQuery = searchQuery.toLowerCase();
		return transactions.filter(({ transaction }) => {
			return (
				transaction.name.toLowerCase().includes(lowerCaseQuery) ||
				transaction.store?.toLowerCase().includes(lowerCaseQuery)
			);
		});
	}

	#filterByAccounts(
		transactions: TransactionWithAccumulatedBalance[],
		selectedAccounts?: Nanoid[],
	): TransactionWithAccumulatedBalance[] {
		if (!selectedAccounts || selectedAccounts.length === 0)
			return transactions;
		return transactions.filter(({ transaction }) => {
			const involvedAccountIds = new Set(
				transaction.originAccounts
					.concat(transaction.destinationAccounts)
					.map((split) => split.accountId.value),
			);
			return selectedAccounts.some((accountId) =>
				involvedAccountIds.has(accountId.value),
			);
		});
	}

	#filterByCategory(
		transactions: TransactionWithAccumulatedBalance[],
		selectedCategory?: string,
	): TransactionWithAccumulatedBalance[] {
		if (!selectedCategory) return transactions;
		return transactions.filter(
			({ transaction }) =>
				transaction.category.value === selectedCategory,
		);
	}

	#filterBySubcategory(
		transactions: TransactionWithAccumulatedBalance[],
		selectedSubcategory?: string,
	): TransactionWithAccumulatedBalance[] {
		if (!selectedSubcategory) return transactions;
		return transactions.filter(
			({ transaction }) =>
				transaction.subcategory.value === selectedSubcategory,
		);
	}
}
