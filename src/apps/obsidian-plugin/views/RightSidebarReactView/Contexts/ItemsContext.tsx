import { createContext } from "react";
import { AwilixContainer } from "awilix";
import { Item } from "contexts/Items/domain";
import { useItems } from "apps/obsidian-plugin/hooks";
import { GetAllUniqueItemsByNameUseCase } from "contexts/Items/application/get-all-unique-items-by-name.usecase";
import { CreateItemUseCase } from "contexts/Items/application/create-item.usecase";
import { DeleteItemUseCase } from "contexts/Items/application/delete-item.usecase";
import { GetAllItemsUseCase } from "contexts/Items/application/get-all-items.usecase";
import { GetItemsUntilDateUseCase } from "contexts/Items/application/get-items-until-date.usecase";
import { ModifyNItemRecurrenceUseCase } from "contexts/Items/application/modify-n-item-recurrence.usecase";
import { UpdateItemUseCase } from "contexts/Items/application/update-item.usecase";
import { RecordItemUseCase } from "contexts/Transactions/application/record-item.usecase";
import { ItemsWithAccumulatedBalanceUseCase } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import { RecordItemRecurrenceUseCase } from "contexts/Transactions/application/record-item-recurrence.usecase";

export type ItemsContextType = {
	useCases: {
		createItem: CreateItemUseCase;
		deleteItem: DeleteItemUseCase;
		updateItem: UpdateItemUseCase;
		recordItem: RecordItemUseCase;
		recordItemRecurrence: RecordItemRecurrenceUseCase;
		modifyNItemRecurrence: ModifyNItemRecurrenceUseCase;
		getAllUniqueItemsByName: GetAllUniqueItemsByNameUseCase;
		getItemsUntilDate: GetItemsUntilDateUseCase;
		getAllItems: GetAllItemsUseCase;
		itemsWithAccumulatedBalanceUseCase: ItemsWithAccumulatedBalanceUseCase;
	};
	scheduledItems: Item[];
	updateItems: () => void;
};

export const ItemsContext = createContext<ItemsContextType>({
	useCases: {
		createItem: {} as CreateItemUseCase,
		getAllItems: {} as GetAllItemsUseCase,
		getAllUniqueItemsByName: {} as GetAllUniqueItemsByNameUseCase,
		recordItem: {} as RecordItemUseCase,
		recordItemRecurrence: {} as RecordItemRecurrenceUseCase,
		getItemsUntilDate: {} as GetItemsUntilDateUseCase,
		deleteItem: {} as DeleteItemUseCase,
		updateItem: {} as UpdateItemUseCase,
		modifyNItemRecurrence: {} as ModifyNItemRecurrenceUseCase,
		itemsWithAccumulatedBalanceUseCase:
			{} as ItemsWithAccumulatedBalanceUseCase,
	},
	scheduledItems: [],
	updateItems: () => {},
});

export const getItemsContextDefault = (
	container: AwilixContainer
): ItemsContextType => {
	const getAllItems = container.resolve("getAllItemsUseCase");
	const recordItem = container.resolve("recordItemUseCase");
	const getItemsUntilDate = container.resolve("getItemsUntilDateUseCase");
	const modifyNItemRecurrence = container.resolve(
		"modifyNItemRecurrenceUseCase"
	);
	const deleteItem = container.resolve("deleteItemUseCase");
	const updateItem = container.resolve("updateItemUseCase");

	const { scheduledItems, updateItems } = useItems({
		getAllItems,
	});

	return {
		useCases: {
			createItem: container.resolve("createItemUseCase"),
			getAllItems,
			getAllUniqueItemsByName: container.resolve(
				"getAllUniqueItemsByNameUseCase"
			),
			getItemsUntilDate,
			recordItem,
			recordItemRecurrence: container.resolve(
				"recordItemRecurrenceUseCase"
			),
			deleteItem,
			updateItem,
			modifyNItemRecurrence,
			itemsWithAccumulatedBalanceUseCase: container.resolve(
				"itemsWithAccumulatedBalanceUseCase"
			),
		},
		scheduledItems,
		updateItems,
	};
};
