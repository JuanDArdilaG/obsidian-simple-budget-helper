import { createContext, useMemo } from "react";
import { AwilixContainer } from "awilix";
import { useTransactions } from "apps/obsidian-plugin/hooks";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { GetAllTransactionsGroupedByDaysUseCase } from "contexts/Reports/application/get-all-transactions-grouped-by-days.usecase";
import { TransactionsReport } from "contexts/Reports/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { AdjustAccountUseCase } from "contexts/Transactions/application/adjust-account.usecase";
import { DeleteTransactionUseCase } from "contexts/Transactions/application/delete-transaction.usecase";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { RecordTransactionUseCase } from "contexts/Transactions/application/record-transaction.usecase";
import { UpdateTransactionUseCase } from "contexts/Transactions/application/update-transaction.usecase";
import { Transaction } from "contexts/Transactions/domain";

export type TransactionsContextType = {
	useCases: {
		recordTransaction: RecordTransactionUseCase;
		deleteTransaction: DeleteTransactionUseCase;
		updateTransaction: UpdateTransactionUseCase;
		getAllTransactions: GetAllTransactionsUseCase;
		getAllTransactionsGroupedByDays: GetAllTransactionsGroupedByDaysUseCase;
		adjustAccount: AdjustAccountUseCase;
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
};

export const TransactionsContext = createContext<TransactionsContextType>({
	useCases: {
		recordTransaction: {} as RecordTransactionUseCase,
		deleteTransaction: {} as DeleteTransactionUseCase,
		updateTransaction: {} as UpdateTransactionUseCase,
		getAllTransactions: {} as GetAllTransactionsUseCase,
		getAllTransactionsGroupedByDays:
			{} as GetAllTransactionsGroupedByDaysUseCase,
		adjustAccount: {} as AdjustAccountUseCase,
	},
	transactions: [],
	updateTransactions: () => {},
	transactionsReport: {} as TransactionsReport,
	filteredTransactions: [],
	setFilters: () => {},
	filteredTransactionsReport: {} as TransactionsReport,
	updateFilteredTransactions: () => {},
});

export const getTransactionsContextValues = (
	container: AwilixContainer
): TransactionsContextType => {
	const getAllTransactions = container.resolve("getAllTransactionsUseCase");
	const getAllTransactionsGroupedByDays = container.resolve(
		"getAllTransactionsGroupedByDaysUseCase"
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

	const {
		transactions,
		updateTransactions,
		filteredTransactions,
		setFilters,
		updateFilteredTransactions,
	} = useTransactions({
		getAllTransactions,
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
			getAllTransactionsGroupedByDays,
		},
		transactions,
		transactionsReport,
		updateTransactions,
		filteredTransactions,
		setFilters,
		filteredTransactionsReport,
		updateFilteredTransactions,
	};
};
