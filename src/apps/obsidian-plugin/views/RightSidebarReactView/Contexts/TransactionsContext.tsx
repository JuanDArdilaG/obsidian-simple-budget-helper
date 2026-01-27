import { StringValueObject } from "@juandardilag/value-objects";
import { useTransactions } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { TransactionsReport } from "contexts/Reports/domain";
import { DeleteTransactionUseCase } from "contexts/Transactions/application/delete-transaction.usecase";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/Transactions/application/get-all-unique-item-stores.usecase";
import { GetAllUniqueTransactionsByNameUseCase } from "contexts/Transactions/application/get-all-unique-transactions.usecase";
import { RecordTransactionUseCase } from "contexts/Transactions/application/record-transaction.usecase";
import { UpdateTransactionUseCase } from "contexts/Transactions/application/update-transaction.usecase";
import { Transaction } from "contexts/Transactions/domain";
import { createContext, useMemo } from "react";
import { GetTransactionsByAccountUseCase } from "../../../../../contexts/Transactions/application/get-transactions-by-account.usecase";
import { GetTransactionsByCategoryUseCase } from "../../../../../contexts/Transactions/application/get-transactions-by-category.usecase";
import { GetTransactionsBySubcategoryUseCase } from "../../../../../contexts/Transactions/application/get-transactions-by-subcategory.usecase";
import { GetTransactionsWithPagination } from "../../../../../contexts/Transactions/application/get-transactions-with-pagination.usecase";

export type TransactionsContextType = {
	useCases: {
		recordTransaction: RecordTransactionUseCase;
		deleteTransaction: DeleteTransactionUseCase;
		updateTransaction: UpdateTransactionUseCase;
		getAllTransactions: GetAllTransactionsUseCase;
		getTransactionsWithPagination: GetTransactionsWithPagination;
		getTransactionsByCategory: GetTransactionsByCategoryUseCase;
		getTransactionsBySubcategory: GetTransactionsBySubcategoryUseCase;
		getTransactionsByAccount: GetTransactionsByAccountUseCase;
		getAllUniqueTransactionsByNameUseCase: GetAllUniqueTransactionsByNameUseCase;
		getAllUniqueItemStores: GetAllUniqueItemStoresUseCase;
	};
	isLoading: boolean;
	transactions: Transaction[];
	transactionsReport: TransactionsReport;
	updateTransactions: () => void;
	stores: StringValueObject[];
	updateStores: () => void;
};

export const TransactionsContext = createContext<TransactionsContextType>({
	useCases: {
		recordTransaction: {} as RecordTransactionUseCase,
		deleteTransaction: {} as DeleteTransactionUseCase,
		updateTransaction: {} as UpdateTransactionUseCase,
		getAllTransactions: {} as GetAllTransactionsUseCase,
		getAllUniqueTransactionsByNameUseCase:
			{} as GetAllUniqueTransactionsByNameUseCase,
		getAllUniqueItemStores: {} as GetAllUniqueItemStoresUseCase,
		getTransactionsWithPagination: {} as GetTransactionsWithPagination,
		getTransactionsByCategory: {} as GetTransactionsByCategoryUseCase,
		getTransactionsBySubcategory: {} as GetTransactionsBySubcategoryUseCase,
		getTransactionsByAccount: {} as GetTransactionsByAccountUseCase,
	},
	transactions: [] as Transaction[],
	updateTransactions: () => {},
	transactionsReport: {} as TransactionsReport,
	isLoading: false,
	stores: [],
	updateStores: () => {},
});

export const getTransactionsContextValues = (
	container: AwilixContainer,
): TransactionsContextType => {
	const getAllTransactions = container.resolve("getAllTransactionsUseCase");
	const getAllUniqueTransactionsByNameUseCase = container.resolve(
		"getAllUniqueTransactionsByNameUseCase",
	);
	const recordTransaction = container.resolve<RecordTransactionUseCase>(
		"recordTransactionUseCase",
	);
	const deleteTransaction = container.resolve<DeleteTransactionUseCase>(
		"deleteTransactionUseCase",
	);
	const updateTransaction = container.resolve<UpdateTransactionUseCase>(
		"updateTransactionUseCase",
	);

	const getAllUniqueItemStores = container.resolve(
		"getAllUniqueItemStoresUseCase",
	);

	const {
		isLoading,
		transactions,
		updateTransactions,
		stores,
		updateStores,
	} = useTransactions({
		getAllTransactions,
		getAllUniqueItemStores,
	});

	const transactionsReport = useMemo(
		() => new TransactionsReport(transactions),
		[transactions],
	);

	console.log("[TransactionsContext] Context value created", {
		transactionCount: transactions.length,
		isLoading,
	});

	return {
		useCases: {
			recordTransaction,
			deleteTransaction,
			updateTransaction,
			getAllTransactions,
			getAllUniqueTransactionsByNameUseCase,
			getAllUniqueItemStores,
			getTransactionsWithPagination:
				container.resolve<GetTransactionsWithPagination>(
					"getTransactionsWithPagination",
				),
			getTransactionsBySubcategory:
				container.resolve<GetTransactionsBySubcategoryUseCase>(
					"getTransactionsBySubcategoryUseCase",
				),
			getTransactionsByCategory:
				container.resolve<GetTransactionsByCategoryUseCase>(
					"getTransactionsByCategoryUseCase",
				),
			getTransactionsByAccount:
				container.resolve<GetTransactionsByAccountUseCase>(
					"getTransactionsByAccountUseCase",
				),
		},
		isLoading,
		transactions,
		transactionsReport,
		updateTransactions,
		stores,
		updateStores,
	};
};
