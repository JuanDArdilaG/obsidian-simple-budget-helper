import { StringValueObject } from "@juandardilag/value-objects";
import { useTransactions } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { CategoryID } from "contexts/Categories/domain";
import { GroupByCategoryWithAccumulatedBalanceUseCase } from "contexts/Reports/application/group-by-category-with-accumulated-balance.service";
import { TransactionsReport } from "contexts/Reports/domain";
import { Nanoid } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { AdjustAccountUseCase } from "contexts/Transactions/application/adjust-account.usecase";
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
		adjustAccount: AdjustAccountUseCase;
		groupByCategoryWithAccumulatedBalance: GroupByCategoryWithAccumulatedBalanceUseCase;
	};
	transactions: Transaction[];
	transactionsReport: TransactionsReport;
	updateTransactions: () => void;
	filteredTransactions: Transaction[];
	setFilters: React.Dispatch<
		React.SetStateAction<
			[
				account?: Nanoid | undefined,
				category?: CategoryID | undefined,
				subCategory?: SubCategoryID | undefined,
			]
		>
	>;
	filteredTransactionsReport: TransactionsReport;
	updateFilteredTransactions: () => void;
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
		adjustAccount: {} as AdjustAccountUseCase,
		groupByCategoryWithAccumulatedBalance:
			{} as GroupByCategoryWithAccumulatedBalanceUseCase,
	},
	transactions: [],
	updateTransactions: () => {},
	transactionsReport: {} as TransactionsReport,
	filteredTransactions: [],
	setFilters: () => {},
	filteredTransactionsReport: {} as TransactionsReport,
	updateFilteredTransactions: () => {},
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
	const adjustAccount = container.resolve<AdjustAccountUseCase>(
		"adjustAccountUseCase",
	);
	const updateTransaction = container.resolve<UpdateTransactionUseCase>(
		"updateTransactionUseCase",
	);

	const getAllUniqueItemStores = container.resolve(
		"getAllUniqueItemStoresUseCase",
	);

	const {
		transactions,
		updateTransactions,
		filteredTransactions,
		setFilters,
		updateFilteredTransactions,
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

	const filteredTransactionsReport = useMemo(
		() => new TransactionsReport(filteredTransactions),
		[filteredTransactions],
	);

	return {
		useCases: {
			recordTransaction,
			deleteTransaction,
			updateTransaction,
			adjustAccount,
			getAllTransactions,
			getAllUniqueTransactionsByNameUseCase,
			getAllUniqueItemStores,
			groupByCategoryWithAccumulatedBalance: container.resolve(
				"groupByCategoryWithAccumulatedBalanceUseCase",
			),
		},
		transactions,
		transactionsReport,
		updateTransactions,
		filteredTransactions,
		setFilters,
		filteredTransactionsReport,
		updateFilteredTransactions,
		stores,
		updateStores,
	};
};
