import { ItemBrand, ItemStore } from "contexts/SimpleItems/domain";
import { useState, useEffect } from "react";
import { useLogger } from "./useLogger";
import { GetAllScheduledItemsUseCase } from "contexts/ScheduledItems/application/get-all-scheduled-items.usecase";
import { GetAllUniqueItemBrandsUseCase } from "contexts/SimpleItems/application/get-all-unique-item-brands.usecase";
import { GetAllUniqueItemStoresUseCase } from "contexts/SimpleItems/application/get-all-unique-item-stores.usecase";
import { ScheduledItem } from "contexts/ScheduledItems/domain";

export const useItems = ({
	getAllScheduledItems,
	getAllUniqueItemBrands,
	getAllUniqueItemStores,
}: {
	getAllScheduledItems: GetAllScheduledItemsUseCase;
	getAllUniqueItemBrands: GetAllUniqueItemBrandsUseCase;
	getAllUniqueItemStores: GetAllUniqueItemStoresUseCase;
}) => {
	const { logger } = useLogger("useItems");

	const [scheduledItems, setScheduledItems] = useState<ScheduledItem[]>([]);
	const [updateScheduledItems, setUpdateScheduledItems] = useState(true);

	const [brands, setBrands] = useState<ItemBrand[]>([]);
	const [updateBrands, setUpdateBrands] = useState(true);

	const [stores, setStores] = useState<ItemStore[]>([]);
	const [updateStores, setUpdateStores] = useState(true);

	useEffect(() => {
		if (updateScheduledItems) {
			setUpdateScheduledItems(false);
			getAllScheduledItems.execute().then((items) => {
				logger.debug("updating scheduled items", {
					items,
				});
				setScheduledItems(items);
			});
		}
	}, [updateScheduledItems]);

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
		scheduledItems,
		updateScheduledItems: () => setUpdateScheduledItems(true),
		brands,
		updateBrands: () => setUpdateBrands(true),
		stores,
		updateStores: () => setUpdateStores(true),
	};
};
