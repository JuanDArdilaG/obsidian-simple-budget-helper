import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { useContext, useEffect, useState } from "react";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { RecurrentItem } from "contexts";
import { ItemsContext } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { AllRecurrentItemsList } from "./AllRecurrentItemsList";

export const AllRecurrentItemsTab = () => {
	const { recurrentItems, updateRecurrentItems } = useContext(ItemsContext);
	const [selectedItem, setSelectedItem] = useState<RecurrentItem>();
	const [action, setAction] = useState<"edit" | "record">();

	useEffect(() => {
		updateRecurrentItems();
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
				<AllRecurrentItemsList
					items={recurrentItems}
					action={action}
					setAction={setAction}
					updateItems={updateRecurrentItems}
					selectedItem={selectedItem}
					setSelectedItem={setSelectedItem}
				/>
			</RightSidebarReactTab>
		</>
	);
};
