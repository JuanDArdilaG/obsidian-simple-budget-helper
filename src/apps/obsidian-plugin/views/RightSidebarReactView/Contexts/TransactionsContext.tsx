import { createContext, useMemo } from "react";
import { AwilixContainer } from "awilix";
import { useTransactions } from "apps/obsidian-plugin/hooks";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { TransactionsReport } from "contexts/Reports/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { AdjustAccountUseCase } from "contexts/Transactions/application/adjust-account.usecase";
import { DeleteTransactionUseCase } from "contexts/Transactions/application/delete-transaction.usecase";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { RecordTransactionUseCase } from "contexts/Transactions/application/record-transaction.usecase";
import { UpdateTransactionUseCase } from "contexts/Transactions/application/update-transaction.usecase";
import { Transaction } from "contexts/Transactions/domain";
import { GetAllUniqueTransactionsByNameUseCase } from "contexts/Transactions/application/get-all-unique-transactions.usecase";
import { GetAllUniqueItemBrandsUseCase } from "contexts/Transactions/application/get-all-unique-item-brands.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/Transactions/application/get-all-unique-item-stores.usecase";
import { ItemBrand, ItemStore } from "contexts/Items/domain";
import { GroupByCategoryWithAccumulatedBalanceUseCase } from "contexts/Reports/application/group-by-category-with-accumulated-balance.service";

export type TransactionsContextType = {
	useCases: {
		recordTransaction: RecordTransactionUseCase;
		deleteTransaction: DeleteTransactionUseCase;
		updateTransaction: UpdateTransactionUseCase;
		getAllTransactions: GetAllTransactionsUseCase;
		getAllUniqueTransactionsByNameUseCase: GetAllUniqueTransactionsByNameUseCase;
		getAllUniqueItemBrands: GetAllUniqueItemBrandsUseCase;
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
				account?: AccountID | undefined,
				category?: CategoryID | undefined,
				subCategory?: SubCategoryID | undefined
			]
		>
	>;
	filteredTransactionsReport: TransactionsReport;
	updateFilteredTransactions: () => void;
	brands: ItemBrand[];
	updateBrands: () => void;
	stores: ItemStore[];
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
		getAllUniqueItemBrands: {} as GetAllUniqueItemBrandsUseCase,
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
	brands: [],
	updateBrands: () => {},
	stores: [],
	updateStores: () => {},
});

export const getTransactionsContextValues = (
	container: AwilixContainer
): TransactionsContextType => {
	const getAllTransactions = container.resolve("getAllTransactionsUseCase");
	const getAllUniqueTransactionsByNameUseCase = container.resolve(
		"getAllUniqueTransactionsByNameUseCase"
	);
	const recordTransaction = container.resolve<RecordTransactionUseCase>(
		"recordTransactionUseCase"
	);
	const deleteTransaction = container.resolve<DeleteTransactionUseCase>(
		"deleteTransactionUseCase"
	);
	const adjustAccount = container.resolve<AdjustAccountUseCase>(
		"adjustAccountUseCase"
	);
	const updateTransaction = container.resolve<UpdateTransactionUseCase>(
		"updateTransactionUseCase"
	);

	const getAllUniqueItemBrands = container.resolve(
		"getAllUniqueItemBrandsUseCase"
	);

	const getAllUniqueItemStores = container.resolve(
		"getAllUniqueItemStoresUseCase"
	);

	const {
		transactions,
		updateTransactions,
		filteredTransactions,
		setFilters,
		updateFilteredTransactions,
		brands,
		updateBrands,
		stores,
		updateStores,
	} = useTransactions({
		getAllTransactions,
		getAllUniqueItemBrands,
		getAllUniqueItemStores,
	});

	const transactionsReport = useMemo(
		() => new TransactionsReport(transactions),
		[transactions]
	);

	const filteredTransactionsReport = useMemo(
		() => new TransactionsReport(filteredTransactions),
		[filteredTransactions]
	);

	return {
		useCases: {
			recordTransaction,
			deleteTransaction,
			updateTransaction,
			adjustAccount,
			getAllTransactions,
			getAllUniqueTransactionsByNameUseCase,
			getAllUniqueItemBrands,
			getAllUniqueItemStores,
			groupByCategoryWithAccumulatedBalance: container.resolve(
				"groupByCategoryWithAccumulatedBalanceUseCase"
			),
		},
		transactions,
		transactionsReport,
		updateTransactions,
		filteredTransactions,
		setFilters,
		filteredTransactionsReport,
		updateFilteredTransactions,
		brands,
		updateBrands,
		stores,
		updateStores,
	};
};
