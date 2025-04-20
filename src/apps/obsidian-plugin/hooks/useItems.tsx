import { Item } from "contexts/Items/domain";
import { useState, useEffect } from "react";
import { useLogger } from "./useLogger";
import { GetAllItemsUseCase } from "contexts/Items/application/get-all-items.usecase";

export const useItems = ({
	getAllItems,
}: {
	getAllItems: GetAllItemsUseCase;
}) => {
	const { logger } = useLogger("useItems");

	const [items, setItems] = useState<Item[]>([]);
	const [updateItems, setUpdateItems] = useState(true);

	useEffect(() => {
		if (updateItems) {
			setUpdateItems(false);
			getAllItems.execute().then(({ items }) => {
				logger.debug("updating scheduled items", {
					items,
				});
				setItems(items);
			});
		}
	}, [updateItems]);

	return {
		scheduledItems: items,
		updateItems: () => setUpdateItems(true),
	};
};
