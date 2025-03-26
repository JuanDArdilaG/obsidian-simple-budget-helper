import { createContext, useMemo } from "react";
import { AwilixContainer } from "awilix";
import {
	RecordTransactionUseCase,
	DeleteTransactionUseCase,
	AdjustAccountUseCase,
	UpdateTransactionUseCase,
	GetAllTransactionsUseCase,
	Transaction,
} from "contexts/Transactions";
import {
	GetAllTransactionsGroupedByDaysUseCase,
	GetAllTransactionsGroupedByDaysUseCaseInput,
	TransactionsReport,
} from "contexts/Reports";
import { useTransactions } from "apps/obsidian-plugin/hooks";
import { AccountID, CategoryID, SubCategoryID } from "contexts";

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
