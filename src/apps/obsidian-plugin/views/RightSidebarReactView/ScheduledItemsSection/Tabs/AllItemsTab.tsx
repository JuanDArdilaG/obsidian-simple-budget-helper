import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { useContext, useEffect, useState } from "react";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { Item } from "contexts/Items/domain";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AllItemsList } from "./AllItemsList";

export const AllItemsTab = () => {
	const { scheduledItems, updateItems } = useContext(ItemsContext);
	const [selectedItem, setSelectedItem] = useState<Item>();
	const [action, setAction] = useState<"edit" | "record">();

	useEffect(() => {
		updateItems();
	}, []);

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setAction={setAction}
					recurrent={selectedItem}
				/>
			)}
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
		</>
	);
};
