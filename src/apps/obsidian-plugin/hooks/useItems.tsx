import { GetAllItemsUseCase } from "contexts/Items/application/get-all-items.usecase";
import { ScheduledItem } from "contexts/Items/domain";
import { useEffect, useState } from "react";
import { useLogger } from "./useLogger";

export const useItems = ({
	getAllItems,
}: {
	getAllItems: GetAllItemsUseCase;
}) => {
	const { logger } = useLogger("useItems");

	const [items, setItems] = useState<ScheduledItem[]>([]);
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
