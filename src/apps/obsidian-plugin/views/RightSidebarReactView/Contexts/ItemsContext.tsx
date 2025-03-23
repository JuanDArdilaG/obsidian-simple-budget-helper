import { createContext } from "react";
import { AwilixContainer } from "awilix";
import {
	CreateSimpleItemUseCase,
	GetAllUniqueItemsByNameUseCase,
	GetAllUniqueItemBrandsUseCase,
	GetAllUniqueItemStoresUseCase,
	ItemBrand,
	ItemStore,
	GetAllUniqueItemBrandsUseCaseOutput,
	GetAllUniqueItemStoresUseCaseOutput,
} from "contexts/Items";
import {
	RecordRecurrentItemUseCase,
	RecordSimpleItemUseCase,
} from "contexts/Transactions";

export type ItemsContextType = {
	useCases: {
		createSimpleItem: CreateSimpleItemUseCase;
		getAllUniqueItemsByName: GetAllUniqueItemsByNameUseCase;
		getAllUniqueItemBrands: GetAllUniqueItemBrandsUseCase;
		getAllUniqueItemStores: GetAllUniqueItemStoresUseCase;
		recordSimpleItem: RecordSimpleItemUseCase;
		recordRecurrentItem: RecordRecurrentItemUseCase;
	};
};

export const ItemsContext = createContext<ItemsContextType>({
	useCases: {
		createSimpleItem: {} as CreateSimpleItemUseCase,
		getAllUniqueItemsByName: {} as GetAllUniqueItemsByNameUseCase,
		getAllUniqueItemBrands: {} as GetAllUniqueItemBrandsUseCase,
		getAllUniqueItemStores: {} as GetAllUniqueItemStoresUseCase,
		recordRecurrentItem: {} as RecordRecurrentItemUseCase,
		recordSimpleItem: {} as RecordSimpleItemUseCase,
	},
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

	return {
		useCases: {
			createSimpleItem: container.resolve("createSimpleItemUseCase"),
			getAllUniqueItemsByName: container.resolve(
				"getAllUniqueItemsByNameUseCase"
			),
			getAllUniqueItemBrands,
			getAllUniqueItemStores,
			recordRecurrentItem,
			recordSimpleItem,
		},
	};
};
