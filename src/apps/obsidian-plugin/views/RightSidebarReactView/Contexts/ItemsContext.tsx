import { createContext, useContext } from "react";
import { AwilixContainer } from "awilix";
import {
	CreateItemUseCase,
	GetAllUniqueItemsByNameUseCase,
	GetAllUniqueItemBrandsUseCase,
	GetAllUniqueItemStoresUseCase,
	GetRecurrentItemsUntilDateUseCase,
	ItemStore,
	ItemBrand,
} from "contexts/Items";
import {
	RecordRecurrentItemUseCase,
	RecordSimpleItemUseCase,
} from "contexts/Transactions";
import { DeleteItemUseCase } from "contexts/Items/application/delete-item.usecase";
import { UpdateItemUseCase } from "contexts/Items/application/update-item.usecase";
import { useItems } from "apps/obsidian-plugin/hooks";

export type ItemsContextType = {
	useCases: {
		createItem: CreateItemUseCase;
		deleteItem: DeleteItemUseCase;
		updateItem: UpdateItemUseCase;
		getAllUniqueItemsByName: GetAllUniqueItemsByNameUseCase;
		getAllUniqueItemBrands: GetAllUniqueItemBrandsUseCase;
		getAllUniqueItemStores: GetAllUniqueItemStoresUseCase;
		recordSimpleItem: RecordSimpleItemUseCase;
		recordRecurrentItem: RecordRecurrentItemUseCase;
		getRecurrentItemsUntilDate: GetRecurrentItemsUntilDateUseCase;
	};
	brands: ItemBrand[];
	stores: ItemStore[];
	updateBrands: () => void;
	updateStores: () => void;
};

export const ItemsContext = createContext<ItemsContextType>({
	useCases: {
		createItem: {} as CreateItemUseCase,
		getAllUniqueItemsByName: {} as GetAllUniqueItemsByNameUseCase,
		getAllUniqueItemBrands: {} as GetAllUniqueItemBrandsUseCase,
		getAllUniqueItemStores: {} as GetAllUniqueItemStoresUseCase,
		recordRecurrentItem: {} as RecordRecurrentItemUseCase,
		recordSimpleItem: {} as RecordSimpleItemUseCase,
		getRecurrentItemsUntilDate: {} as GetRecurrentItemsUntilDateUseCase,
		deleteItem: {} as DeleteItemUseCase,
		updateItem: {} as UpdateItemUseCase,
	},
	brands: [],
	stores: [],
	updateBrands: () => {},
	updateStores: () => {},
});

export const getItemsContextDefault = (
	container: AwilixContainer
): ItemsContextType => {
	const getAllUniqueItemBrands = container.resolve(
		"getAllUniqueItemBrandsUseCase"
	);
	const getAllUniqueItemStores = container.resolve(
		"getAllUniqueItemStoresUseCase"
	);
	const recordRecurrentItem = container.resolve("recordRecurrentItemUseCase");
	const recordSimpleItem = container.resolve("recordSimpleItemUseCase");
	const getRecurrentItemsUntilDate = container.resolve(
		"getRecurrentItemsUntilDateUseCase"
	);
	const deleteItem = container.resolve("deleteItemUseCase");
	const updateItem = container.resolve("updateItemUseCase");

	const { brands, stores, updateBrands, updateStores } = useItems({
		getAllUniqueItemBrands,
		getAllUniqueItemStores,
	});

	return {
		useCases: {
			createItem: container.resolve("createItemUseCase"),
			getAllUniqueItemsByName: container.resolve(
				"getAllUniqueItemsByNameUseCase"
			),
			getAllUniqueItemBrands,
			getAllUniqueItemStores,
			getRecurrentItemsUntilDate,
			recordRecurrentItem,
			recordSimpleItem,
			deleteItem,
			updateItem,
		},
		brands,
		stores,
		updateBrands,
		updateStores,
	};
};
