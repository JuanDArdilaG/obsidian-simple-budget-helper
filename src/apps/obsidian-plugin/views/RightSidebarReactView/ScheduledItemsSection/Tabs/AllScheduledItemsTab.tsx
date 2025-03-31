import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { useContext, useEffect, useState } from "react";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { ScheduledItem } from "contexts/ScheduledItems/domain";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AllScheduledItemsList } from "./AllScheduledItemsList";

export const AllScheduledItemsTab = () => {
	const { scheduledItems, updateScheduledItems } = useContext(ItemsContext);
	const [selectedItem, setSelectedItem] = useState<ScheduledItem>();
	const [action, setAction] = useState<"edit" | "record">();

	useEffect(() => {
		updateScheduledItems();
	}, []);

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setAction={setAction}
					item={selectedItem}
				/>
			)}
			<RightSidebarReactTab title="All Items" subtitle>
				<AllScheduledItemsList
					items={scheduledItems}
					action={action}
					setAction={setAction}
					updateItems={updateScheduledItems}
					selectedItem={selectedItem}
					setSelectedItem={setSelectedItem}
				/>
			</RightSidebarReactTab>
		</>
	);
};
