import { createContext } from "react";
import { AwilixContainer } from "awilix";
import {
	RecordTransactionUseCase,
	DeleteTransactionUseCase,
	AdjustAccountUseCase,
	UpdateTransactionUseCase,
	GetAllTransactionsUseCase,
} from "contexts/Transactions";
import { GetAllTransactionsGroupedByDaysUseCase } from "contexts/Reports";

export type TransactionsContextType = {
	useCases: {
		recordTransaction: RecordTransactionUseCase;
		deleteTransaction: DeleteTransactionUseCase;
		updateTransaction: UpdateTransactionUseCase;
		getAllTransactions: GetAllTransactionsUseCase;
		getAllTransactionsGroupedByDays: GetAllTransactionsGroupedByDaysUseCase;
		adjustAccount: AdjustAccountUseCase;
	};
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

	return {
		useCases: {
			recordTransaction,
			deleteTransaction,
			updateTransaction,
			adjustAccount,
			getAllTransactions,
			getAllTransactionsGroupedByDays,
		},
	};
};
