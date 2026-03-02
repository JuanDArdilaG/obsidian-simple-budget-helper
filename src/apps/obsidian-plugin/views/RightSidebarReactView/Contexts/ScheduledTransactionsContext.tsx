import { useScheduledTransactions } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { CreateScheduledItemUseCase } from "contexts/ScheduledTransactions/application/create-scheduled-item.usecase";
import { DeleteItemRecurrenceUseCase } from "contexts/ScheduledTransactions/application/delete-scheduled-transaction-recurrence.usecase";
import { ModifyNItemRecurrenceUseCase } from "contexts/ScheduledTransactions/application/modify-n-item-recurrence.usecase";
import { RecordItemUseCase } from "contexts/Transactions/application/record-item.usecase";
import { createContext } from "react";
import { DeleteScheduledTransactionUseCase } from "../../../../../contexts/ScheduledTransactions/application/delete-scheduled-transaction.usecase";
import { EditScheduledTransactionUseCase } from "../../../../../contexts/ScheduledTransactions/application/edit-scheduled-transaction-amount.usecase";
import { EditScheduledTransactionRecurrencePatternUseCase } from "../../../../../contexts/ScheduledTransactions/application/edit-scheduled-transaction-frequency.usecase";
import { EditScheduledTransactionNameUseCase } from "../../../../../contexts/ScheduledTransactions/application/edit-scheduled-transaction-name.usecase";
import { EditScheduledTransactionStartDateUseCase } from "../../../../../contexts/ScheduledTransactions/application/edit-scheduled-transaction-start-date.usecase";
import { GetAllScheduledTransactionsUseCase } from "../../../../../contexts/ScheduledTransactions/application/get-all-scheduled-transactions";
import { GetScheduledTransactionsUntilDateUseCase } from "../../../../../contexts/ScheduledTransactions/application/get-items-until-date.usecase";
import { ScheduledTransactionsWithAccumulatedBalanceUseCase } from "../../../../../contexts/ScheduledTransactions/application/items-with-accumulated-balance.usecase";
import { NextMonthsExpensesUseCase } from "../../../../../contexts/ScheduledTransactions/application/next-months-expenses.usecase";
import { NextPendingOccurrenceUseCase } from "../../../../../contexts/ScheduledTransactions/application/next-pending-occurrence.usecase";
import { RecordScheduledTransactionUseCase } from "../../../../../contexts/ScheduledTransactions/application/record-scheduled-transaction.usecase";
import { ScheduledTransaction } from "../../../../../contexts/ScheduledTransactions/domain";
import { CreateStoreUseCase } from "../../../../../contexts/Stores/application/create-store.usecase";
import { GetAllStoresUseCase } from "../../../../../contexts/Stores/application/get-all-stores.usecase";

export type ScheduledTransactionsContextType = {
	useCases: {
		createScheduledItem: CreateScheduledItemUseCase;
		createStore: CreateStoreUseCase;
		deleteScheduledTransaction: DeleteScheduledTransactionUseCase;
		deleteItemRecurrence: DeleteItemRecurrenceUseCase;
		editScheduledTransactionName: EditScheduledTransactionNameUseCase;
		editScheduledTransaction: EditScheduledTransactionUseCase;
		editScheduledTransactionRecurrencePattern: EditScheduledTransactionRecurrencePatternUseCase;
		editScheduledTransactionStartDate: EditScheduledTransactionStartDateUseCase;
		recordItem: RecordItemUseCase;
		recordItemRecurrence: RecordScheduledTransactionUseCase;
		modifyNItemRecurrence: ModifyNItemRecurrenceUseCase;
		getAllStores: GetAllStoresUseCase;
		getScheduledTransactionsUntilDate: GetScheduledTransactionsUntilDateUseCase;
		itemsWithAccumulatedBalanceUseCase: ScheduledTransactionsWithAccumulatedBalanceUseCase;
		nextPendingOccurrenceUseCase: NextPendingOccurrenceUseCase;
		nextMonthExpensesUseCase: NextMonthsExpensesUseCase;
	};
	scheduledItems: ScheduledTransaction[];
	updateScheduledTransactions: () => void;
};

export const ScheduledTransactionsContext =
	createContext<ScheduledTransactionsContextType>({
		useCases: {
			createScheduledItem: {} as CreateScheduledItemUseCase,
			deleteScheduledTransaction: {} as DeleteScheduledTransactionUseCase,
			createStore: {} as CreateStoreUseCase,
			getAllStores: {} as GetAllStoresUseCase,
			recordItem: {} as RecordItemUseCase,
			recordItemRecurrence: {} as RecordScheduledTransactionUseCase,
			getScheduledTransactionsUntilDate:
				{} as GetScheduledTransactionsUntilDateUseCase,
			deleteItemRecurrence: {} as DeleteItemRecurrenceUseCase,
			editScheduledTransactionName:
				{} as EditScheduledTransactionNameUseCase,
			editScheduledTransaction: {} as EditScheduledTransactionUseCase,
			editScheduledTransactionRecurrencePattern:
				{} as EditScheduledTransactionRecurrencePatternUseCase,
			editScheduledTransactionStartDate:
				{} as EditScheduledTransactionStartDateUseCase,
			modifyNItemRecurrence: {} as ModifyNItemRecurrenceUseCase,
			itemsWithAccumulatedBalanceUseCase:
				{} as ScheduledTransactionsWithAccumulatedBalanceUseCase,
			nextPendingOccurrenceUseCase: {} as NextPendingOccurrenceUseCase,
			nextMonthExpensesUseCase: {} as NextMonthsExpensesUseCase,
		},
		scheduledItems: [],
		updateScheduledTransactions: () => {},
	});

export const useItemsContextDefault = (
	container: AwilixContainer,
): ScheduledTransactionsContextType => {
	const getAllScheduledTransactionsUseCase =
		container.resolve<GetAllScheduledTransactionsUseCase>(
			"getAllScheduledTransactionsUseCase",
		);
	const recordItem =
		container.resolve<RecordItemUseCase>("recordItemUseCase");
	const getItemsUntilDate =
		container.resolve<GetScheduledTransactionsUntilDateUseCase>(
			"getScheduledTransactionsUntilDateUseCase",
		);
	const modifyNItemRecurrence =
		container.resolve<ModifyNItemRecurrenceUseCase>(
			"modifyNItemRecurrenceUseCase",
		);
	const deleteItemRecurrence = container.resolve<DeleteItemRecurrenceUseCase>(
		"deleteItemRecurrenceUseCase",
	);

	const { scheduledItems, updateScheduledTransactions } =
		useScheduledTransactions({
			getAllScheduledTransactionsUseCase,
		});

	return {
		useCases: {
			createScheduledItem:
				container.resolve<CreateScheduledItemUseCase>(
					"createItemUseCase",
				),
			deleteScheduledTransaction:
				container.resolve<DeleteScheduledTransactionUseCase>(
					"deleteScheduledTransactionUseCase",
				),
			createStore:
				container.resolve<CreateStoreUseCase>("createStoreUseCase"),
			getAllStores: container.resolve<GetAllStoresUseCase>(
				"getAllStoresUseCase",
			),
			getScheduledTransactionsUntilDate: getItemsUntilDate,
			recordItem,
			recordItemRecurrence:
				container.resolve<RecordScheduledTransactionUseCase>(
					"recordItemRecurrenceUseCase",
				),
			deleteItemRecurrence,
			editScheduledTransactionName:
				container.resolve<EditScheduledTransactionNameUseCase>(
					"editScheduledTransactionNameUseCase",
				),
			editScheduledTransaction:
				container.resolve<EditScheduledTransactionUseCase>(
					"editScheduledTransactionUseCase",
				),
			editScheduledTransactionRecurrencePattern:
				container.resolve<EditScheduledTransactionRecurrencePatternUseCase>(
					"editScheduledTransactionRecurrencePatternUseCase",
				),
			editScheduledTransactionStartDate:
				container.resolve<EditScheduledTransactionStartDateUseCase>(
					"editScheduledTransactionStartDateUseCase",
				),
			modifyNItemRecurrence,
			itemsWithAccumulatedBalanceUseCase:
				container.resolve<ScheduledTransactionsWithAccumulatedBalanceUseCase>(
					"itemsWithAccumulatedBalanceUseCase",
				),
			nextPendingOccurrenceUseCase:
				container.resolve<NextPendingOccurrenceUseCase>(
					"nextPendingOccurrenceUseCase",
				),
			nextMonthExpensesUseCase:
				container.resolve<NextMonthsExpensesUseCase>(
					"nextMonthOccurrencesUseCase",
				),
		},
		scheduledItems,
		updateScheduledTransactions,
	};
};
