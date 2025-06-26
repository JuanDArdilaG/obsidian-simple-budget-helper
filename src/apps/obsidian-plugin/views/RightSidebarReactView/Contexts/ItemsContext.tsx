import { useItems } from "apps/obsidian-plugin/hooks";
import { AwilixContainer } from "awilix";
import { CreateBrandUseCase } from "contexts/Items/application/create-brand.usecase";
import { CreateItemUseCase } from "contexts/Items/application/create-item.usecase";
import { CreateProviderUseCase } from "contexts/Items/application/create-provider.usecase";
import { CreateRegularItemUseCase } from "contexts/Items/application/create-regular-item.usecase";
import { CreateStoreUseCase } from "contexts/Items/application/create-store.usecase";
import { DeleteItemUseCase } from "contexts/Items/application/delete-item.usecase";
import { GetAllBrandsUseCase } from "contexts/Items/application/get-all-brands.usecase";
import { GetAllItemsUseCase } from "contexts/Items/application/get-all-items.usecase";
import { GetAllProvidersUseCase } from "contexts/Items/application/get-all-providers.usecase";
import { GetAllRegularItemsUseCase } from "contexts/Items/application/get-all-regular-items.usecase";
import { GetAllStoresUseCase } from "contexts/Items/application/get-all-stores.usecase";
import { GetAllUniqueItemsByNameUseCase } from "contexts/Items/application/get-all-unique-items-by-name.usecase";
import { GetItemsUntilDateUseCase } from "contexts/Items/application/get-items-until-date.usecase";
import { ItemsWithAccumulatedBalanceUseCase } from "contexts/Items/application/items-with-accumulated-balance.usecase";
import { ModifyNItemRecurrenceUseCase } from "contexts/Items/application/modify-n-item-recurrence.usecase";
import { UpdateItemUseCase } from "contexts/Items/application/update-item.usecase";
import { UpdateRegularItemUseCase } from "contexts/Items/application/update-regular-item.usecase";
import { ScheduledItem } from "contexts/Items/domain";
import { RecordItemRecurrenceUseCase } from "contexts/Transactions/application/record-item-recurrence.usecase";
import { RecordItemUseCase } from "contexts/Transactions/application/record-item.usecase";
import { createContext } from "react";

export type ItemsContextType = {
	useCases: {
		createItem: CreateItemUseCase;
		createRegularItem: CreateRegularItemUseCase;
		createBrand: CreateBrandUseCase;
		createStore: CreateStoreUseCase;
		createProvider: CreateProviderUseCase;
		deleteItem: DeleteItemUseCase;
		updateItem: UpdateItemUseCase;
		updateRegularItem: UpdateRegularItemUseCase;
		recordItem: RecordItemUseCase;
		recordItemRecurrence: RecordItemRecurrenceUseCase;
		modifyNItemRecurrence: ModifyNItemRecurrenceUseCase;
		getAllUniqueItemsByName: GetAllUniqueItemsByNameUseCase;
		getAllRegularItems: GetAllRegularItemsUseCase;
		getAllBrands: GetAllBrandsUseCase;
		getAllStores: GetAllStoresUseCase;
		getAllProviders: GetAllProvidersUseCase;
		getItemsUntilDate: GetItemsUntilDateUseCase;
		getAllItems: GetAllItemsUseCase;
		itemsWithAccumulatedBalanceUseCase: ItemsWithAccumulatedBalanceUseCase;
	};
	scheduledItems: ScheduledItem[];
	updateItems: () => void;
};

export const ItemsContext = createContext<ItemsContextType>({
	useCases: {
		createItem: {} as CreateItemUseCase,
		createRegularItem: {} as CreateRegularItemUseCase,
		createBrand: {} as CreateBrandUseCase,
		createStore: {} as CreateStoreUseCase,
		createProvider: {} as CreateProviderUseCase,
		getAllItems: {} as GetAllItemsUseCase,
		getAllUniqueItemsByName: {} as GetAllUniqueItemsByNameUseCase,
		getAllRegularItems: {} as GetAllRegularItemsUseCase,
		getAllBrands: {} as GetAllBrandsUseCase,
		getAllStores: {} as GetAllStoresUseCase,
		getAllProviders: {} as GetAllProvidersUseCase,
		recordItem: {} as RecordItemUseCase,
		recordItemRecurrence: {} as RecordItemRecurrenceUseCase,
		getItemsUntilDate: {} as GetItemsUntilDateUseCase,
		deleteItem: {} as DeleteItemUseCase,
		updateItem: {} as UpdateItemUseCase,
		updateRegularItem: {} as UpdateRegularItemUseCase,
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
			createRegularItem: container.resolve("createRegularItemUseCase"),
			createBrand: container.resolve("createBrandUseCase"),
			createStore: container.resolve("createStoreUseCase"),
			createProvider: container.resolve("createProviderUseCase"),
			getAllItems,
			getAllUniqueItemsByName: container.resolve(
				"getAllUniqueItemsByNameUseCase"
			),
			getAllRegularItems: container.resolve("getAllRegularItemsUseCase"),
			getAllBrands: container.resolve("getAllBrandsUseCase"),
			getAllStores: container.resolve("getAllStoresUseCase"),
			getAllProviders: container.resolve("getAllProvidersUseCase"),
			getItemsUntilDate,
			recordItem,
			recordItemRecurrence: container.resolve(
				"recordItemRecurrenceUseCase"
			),
			deleteItem,
			updateItem,
			updateRegularItem: container.resolve("updateRegularItemUseCase"),
			modifyNItemRecurrence,
			itemsWithAccumulatedBalanceUseCase: container.resolve(
				"itemsWithAccumulatedBalanceUseCase"
			),
		},
		scheduledItems,
		updateItems,
	};
};
