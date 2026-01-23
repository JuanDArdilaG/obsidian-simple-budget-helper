import { StringValueObject } from "@juandardilag/value-objects";
import { useTransactions } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { GroupByCategoryWithAccumulatedBalanceUseCase } from "contexts/Reports/application/group-by-category-with-accumulated-balance.service";
import { TransactionsReport } from "contexts/Reports/domain";
import { DeleteTransactionUseCase } from "contexts/Transactions/application/delete-transaction.usecase";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/Transactions/application/get-all-unique-item-stores.usecase";
import { GetAllUniqueTransactionsByNameUseCase } from "contexts/Transactions/application/get-all-unique-transactions.usecase";
import { RecordTransactionUseCase } from "contexts/Transactions/application/record-transaction.usecase";
import { UpdateTransactionUseCase } from "contexts/Transactions/application/update-transaction.usecase";
import { Transaction } from "contexts/Transactions/domain";
import { createContext, useMemo } from "react";

export type TransactionsContextType = {
	useCases: {
		recordTransaction: RecordTransactionUseCase;
		deleteTransaction: DeleteTransactionUseCase;
		updateTransaction: UpdateTransactionUseCase;
		getAllTransactions: GetAllTransactionsUseCase;
		getAllUniqueTransactionsByNameUseCase: GetAllUniqueTransactionsByNameUseCase;
		getAllUniqueItemStores: GetAllUniqueItemStoresUseCase;
		groupByCategoryWithAccumulatedBalance: GroupByCategoryWithAccumulatedBalanceUseCase;
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
		groupByCategoryWithAccumulatedBalance:
			{} as GroupByCategoryWithAccumulatedBalanceUseCase,
	},
	transactions: [],
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

	return {
		useCases: {
			recordTransaction,
			deleteTransaction,
			updateTransaction,
			getAllTransactions,
			getAllUniqueTransactionsByNameUseCase,
			getAllUniqueItemStores,
			groupByCategoryWithAccumulatedBalance: container.resolve(
				"groupByCategoryWithAccumulatedBalanceUseCase",
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
