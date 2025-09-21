import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { ScheduledItem } from "contexts/Items/domain";
import { useContext, useEffect, useState } from "react";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { AllItemsList } from "./AllItemsList";

export const AllItemsTab = () => {
	const { scheduledItems, updateItems } = useContext(ItemsContext);
	const [selectedItem, setSelectedItem] = useState<ScheduledItem>();
	const [action, setAction] = useState<"edit" | "record">();

	useEffect(() => {
		updateItems();
	}, []);

	return (
		<RightSidebarReactTab title="All Items" subtitle>
			<AllItemsList
				items={scheduledItems}
				action={action}
				setAction={setAction}
				updateItems={updateItems}
				selectedItem={selectedItem}
				setSelectedItem={setSelectedItem}
			/>
		</RightSidebarReactTab>
	);
};
