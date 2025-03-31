import { createContext } from "react";
import { AwilixContainer } from "awilix";
import { ItemStore, ItemBrand } from "contexts/SimpleItems/domain";
import { DeleteSimpleItemUseCase } from "contexts/SimpleItems/application/delete-simple-item.usecase";
import { UpdateSimpleItemUseCase } from "contexts/SimpleItems/application/update-simple-item.usecase";
import { useItems } from "apps/obsidian-plugin/hooks";
import { CreateItemUseCase } from "contexts/SimpleItems/application/create-simple-item.usecase";
import { GetAllUniqueItemBrandsUseCase } from "contexts/SimpleItems/application/get-all-unique-item-brands.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/SimpleItems/application/get-all-unique-item-stores.usecase";
import { GetAllUniqueItemsByNameUseCase } from "contexts/SimpleItems/application/get-all-unique-items-by-name.usecase";
import { RecordSimpleItemUseCase } from "contexts/Transactions/application/record-simple-item.usecase";
import { GetAllScheduledItemsUseCase } from "contexts/ScheduledItems/application/get-all-scheduled-items.usecase";
import { GetScheduledItemsUntilDateUseCase } from "contexts/ScheduledItems/application/get-scheduled-items-until-date.usecase";
import { RecordScheduledItemUseCase } from "contexts/Transactions/application/record-scheduled-item.usecase";
import { ScheduledItem } from "contexts/ScheduledItems/domain";
import { ModifyNScheduledItemRecurrenceUseCase } from "contexts/ScheduledItems/application/modify-n-scheduled-item-recurrence.usecase";
import { CreateScheduledItemUseCase } from "contexts/ScheduledItems/application/create-scheduled-item.usecase";
import { UpdateScheduledItemUseCase } from "contexts/ScheduledItems/application/update-scheduled-item.usecase";
import { DeleteScheduledItemUseCase } from "contexts/ScheduledItems/application/delete-scheduled-item.usecase";

export type ItemsContextType = {
	useCases: {
		createItem: CreateItemUseCase;
		createScheduledItem: CreateScheduledItemUseCase;
		deleteItem: DeleteSimpleItemUseCase;
		deleteScheduledItem: DeleteScheduledItemUseCase;
		updateItem: UpdateSimpleItemUseCase;
		updateScheduledItemUseCase: UpdateScheduledItemUseCase;
		modifyNScheduledItemRecurrence: ModifyNScheduledItemRecurrenceUseCase;
		getAllUniqueItemsByName: GetAllUniqueItemsByNameUseCase;
		getAllUniqueItemBrands: GetAllUniqueItemBrandsUseCase;
		getAllUniqueItemStores: GetAllUniqueItemStoresUseCase;
		recordSimpleItem: RecordSimpleItemUseCase;
		recordScheduledItem: RecordScheduledItemUseCase;
		getScheduledItemsUntilDate: GetScheduledItemsUntilDateUseCase;
		getAllScheduledItems: GetAllScheduledItemsUseCase;
	};
	scheduledItems: ScheduledItem[];
	updateScheduledItems: () => void;
	brands: ItemBrand[];
	updateBrands: () => void;
	stores: ItemStore[];
	updateStores: () => void;
};

export const ItemsContext = createContext<ItemsContextType>({
	useCases: {
		createItem: {} as CreateItemUseCase,
		createScheduledItem: {} as CreateScheduledItemUseCase,
		getAllScheduledItems: {} as GetAllScheduledItemsUseCase,
		getAllUniqueItemsByName: {} as GetAllUniqueItemsByNameUseCase,
		getAllUniqueItemBrands: {} as GetAllUniqueItemBrandsUseCase,
		getAllUniqueItemStores: {} as GetAllUniqueItemStoresUseCase,
		recordScheduledItem: {} as RecordScheduledItemUseCase,
		recordSimpleItem: {} as RecordSimpleItemUseCase,
		getScheduledItemsUntilDate: {} as GetScheduledItemsUntilDateUseCase,
		deleteItem: {} as DeleteSimpleItemUseCase,
		deleteScheduledItem: {} as DeleteScheduledItemUseCase,
		updateItem: {} as UpdateSimpleItemUseCase,
		updateScheduledItemUseCase: {} as UpdateScheduledItemUseCase,
		modifyNScheduledItemRecurrence:
			{} as ModifyNScheduledItemRecurrenceUseCase,
	},
	scheduledItems: [],
	updateScheduledItems: () => {},
	brands: [],
	updateBrands: () => {},
	stores: [],
	updateStores: () => {},
});

export const getItemsContextDefault = (
	container: AwilixContainer
): ItemsContextType => {
	const getAllScheduledItems = container.resolve(
		"getAllScheduledItemsUseCase"
	);
	const getAllUniqueItemBrands = container.resolve(
		"getAllUniqueItemBrandsUseCase"
	);
	const getAllUniqueItemStores = container.resolve(
		"getAllUniqueItemStoresUseCase"
	);
	const recordScheduledItem = container.resolve("recordScheduledItemUseCase");
	const recordSimpleItem = container.resolve("recordSimpleItemUseCase");
	const getScheduledItemsUntilDate = container.resolve(
		"getScheduledItemsUntilDateUseCase"
	);
	const modifyNScheduledItemRecurrence = container.resolve(
		"modifyNScheduledItemRecurrenceUseCase"
	);
	const deleteItem = container.resolve("deleteItemUseCase");
	const updateItem = container.resolve("updateItemUseCase");

	const {
		scheduledItems,
		brands,
		stores,
		updateScheduledItems,
		updateBrands,
		updateStores,
	} = useItems({
		getAllScheduledItems,
		getAllUniqueItemBrands,
		getAllUniqueItemStores,
	});

	return {
		useCases: {
			createItem: container.resolve("createItemUseCase"),
			createScheduledItem: container.resolve(
				"createScheduledItemUseCase"
			),
			getAllScheduledItems,
			getAllUniqueItemsByName: container.resolve(
				"getAllUniqueItemsByNameUseCase"
			),
			getAllUniqueItemBrands,
			getAllUniqueItemStores,
			getScheduledItemsUntilDate,
			recordScheduledItem,
			recordSimpleItem,
			deleteItem,
			deleteScheduledItem: container.resolve(
				"deleteScheduledItemUseCase"
			),
			updateItem,
			updateScheduledItemUseCase: container.resolve(
				"updateScheduledItemUseCase"
			),
			modifyNScheduledItemRecurrence,
		},
		scheduledItems,
		updateScheduledItems,
		brands,
		updateBrands,
		stores,
		updateStores,
	};
};
