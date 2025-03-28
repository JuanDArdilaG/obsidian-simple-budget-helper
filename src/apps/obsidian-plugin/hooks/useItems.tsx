import {
	GetAllRecurrentItemsUseCase,
	GetAllUniqueItemBrandsUseCase,
	GetAllUniqueItemStoresUseCase,
	ItemBrand,
	ItemStore,
	RecurrentItem,
} from "contexts/Items";
import { useState, useEffect } from "react";
import { useLogger } from "./useLogger";

export const useItems = ({
	getAllRecurrentItems,
	getAllUniqueItemBrands,
	getAllUniqueItemStores,
}: {
	getAllRecurrentItems: GetAllRecurrentItemsUseCase;
	getAllUniqueItemBrands: GetAllUniqueItemBrandsUseCase;
	getAllUniqueItemStores: GetAllUniqueItemStoresUseCase;
}) => {
	const logger = useLogger("useItems", false);

	const [recurrentItems, setRecurrentItems] = useState<RecurrentItem[]>([]);
	const [updateRecurrentItems, setUpdateRecurrentItems] = useState(true);

	const [brands, setBrands] = useState<ItemBrand[]>([]);
	const [updateBrands, setUpdateBrands] = useState(true);

	const [stores, setStores] = useState<ItemStore[]>([]);
	const [updateStores, setUpdateStores] = useState(true);

	useEffect(() => {
		if (updateRecurrentItems) {
			setUpdateRecurrentItems(false);
			getAllRecurrentItems.execute().then((items) => {
				logger.debug("updating recurrent items", {
					items,
				});
				setRecurrentItems(items);
			});
		}
	}, [updateRecurrentItems]);

	useEffect(() => {
		if (updateBrands) {
			setUpdateBrands(false);
			getAllUniqueItemBrands.execute().then((brands) => {
				logger.debug("updating brands", {
					brands,
				});
				setBrands(brands);
			});
		}
	}, [updateBrands]);

	useEffect(() => {
		if (updateStores) {
			setUpdateStores(false);
			getAllUniqueItemStores.execute().then((stores) => {
				logger.debug("updating stores", {
					updateStores,
					brands,
				});
				setStores(stores);
			});
		}
	}, [updateStores]);

	return {
		recurrentItems,
		updateRecurrentItems: () => setUpdateRecurrentItems(true),
		brands,
		updateBrands: () => setUpdateBrands(true),
		stores,
		updateStores: () => setUpdateStores(true),
	};
};
