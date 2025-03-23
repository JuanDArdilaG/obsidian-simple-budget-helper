import { ItemBrand, ItemStore, Logger } from "contexts";
import { useState, useEffect, useContext } from "react";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";

export const useItems = () => {
	const {
		useCases: { getAllUniqueItemBrands, getAllUniqueItemStores },
	} = useContext(ItemsContext);

	const [brands, setBrands] = useState<ItemBrand[]>([]);
	const [updateBrands, setUpdateBrands] = useState(true);

	const [stores, setStores] = useState<ItemStore[]>([]);
	const [updateStores, setUpdateStores] = useState(true);

	useEffect(() => {
		if (updateBrands) {
			setUpdateBrands(false);
			Logger.debug("updating brands", {
				brands,
			});
			getAllUniqueItemBrands
				.execute()
				.then((brands) => setBrands(brands));
		}
	}, [updateBrands]);

	useEffect(() => {
		if (updateStores) {
			setUpdateStores(false);
			Logger.debug("updating stores", {
				updateStores,
				brands,
			});
			getAllUniqueItemStores
				.execute()
				.then((stores) => setStores(stores));
		}
	}, [updateStores]);

	return {
		brands,
		updateBrands: () => setUpdateBrands(true),
		stores,
		updateStores: () => setUpdateStores(true),
	};
};
