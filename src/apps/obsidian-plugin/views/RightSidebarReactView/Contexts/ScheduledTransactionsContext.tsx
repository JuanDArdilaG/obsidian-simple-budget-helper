import { useScheduledTransactions } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { CreateScheduledItemUseCase } from "contexts/ScheduledTransactions/application/create-scheduled-item.usecase";
import { DeleteItemRecurrenceUseCase } from "contexts/ScheduledTransactions/application/delete-scheduled-transaction-recurrence.usecase";
import { ModifyNItemRecurrenceUseCase } from "contexts/ScheduledTransactions/application/modify-n-item-recurrence.usecase";
import { RecordItemUseCase } from "contexts/Transactions/application/record-item.usecase";
import { createContext } from "react";
import { DeleteScheduledTransactionUseCase } from "../../../../../contexts/ScheduledTransactions/application/delete-scheduled-transaction.usecase";
import { EditScheduledTransactionAmountUseCase } from "../../../../../contexts/ScheduledTransactions/application/edit-scheduled-transaction-amount.usecase";
import { EditScheduledTransactionRecurrencePatternUseCase } from "../../../../../contexts/ScheduledTransactions/application/edit-scheduled-transaction-frequency.usecase";
import { EditScheduledTransactionNameUseCase } from "../../../../../contexts/ScheduledTransactions/application/edit-scheduled-transaction-name.usecase";
import { EditScheduledTransactionStartDateUseCase } from "../../../../../contexts/ScheduledTransactions/application/edit-scheduled-transaction-start-date.usecase";
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
		editScheduledTransactionAmount: EditScheduledTransactionAmountUseCase;
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
			editScheduledTransactionAmount:
				{} as EditScheduledTransactionAmountUseCase,
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
	const getAllScheduledTransactionsUseCase = container.resolve(
		"getAllScheduledTransactionsUseCase",
	);
	const recordItem = container.resolve("recordItemUseCase");
	const getItemsUntilDate = container.resolve(
		"getScheduledTransactionsUntilDateUseCase",
	);
	const modifyNItemRecurrence = container.resolve(
		"modifyNItemRecurrenceUseCase",
	);
	const deleteItemRecurrence = container.resolve(
		"deleteItemRecurrenceUseCase",
	);

	const { scheduledItems, updateScheduledTransactions } =
		useScheduledTransactions({
			getAllScheduledTransactionsUseCase,
		});

	return {
		useCases: {
			createScheduledItem: container.resolve("createItemUseCase"),
			deleteScheduledTransaction: container.resolve(
				"deleteScheduledTransactionUseCase",
			),
			createStore: container.resolve("createStoreUseCase"),
			getAllStores: container.resolve("getAllStoresUseCase"),
			getScheduledTransactionsUntilDate: getItemsUntilDate,
			recordItem,
			recordItemRecurrence: container.resolve(
				"recordItemRecurrenceUseCase",
			),
			deleteItemRecurrence,
			editScheduledTransactionName: container.resolve(
				"editScheduledTransactionNameUseCase",
			),
			editScheduledTransactionAmount: container.resolve(
				"editScheduledTransactionAmountUseCase",
			),
			editScheduledTransactionRecurrencePattern: container.resolve(
				"editScheduledTransactionRecurrencePatternUseCase",
			),
			editScheduledTransactionStartDate: container.resolve(
				"editScheduledTransactionStartDateUseCase",
			),
			modifyNItemRecurrence,
			itemsWithAccumulatedBalanceUseCase: container.resolve(
				"itemsWithAccumulatedBalanceUseCase",
			),
			nextPendingOccurrenceUseCase: container.resolve(
				"nextPendingOccurrenceUseCase",
			),
			nextMonthExpensesUseCase: container.resolve(
				"nextMonthOccurrencesUseCase",
			),
		},
		scheduledItems,
		updateScheduledTransactions,
	};
};
