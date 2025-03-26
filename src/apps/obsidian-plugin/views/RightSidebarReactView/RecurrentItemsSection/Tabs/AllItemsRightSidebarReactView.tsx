import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { RecurrentItemsList } from "../RecurrentItemsList";
import { App } from "obsidian";
import { useState } from "react";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { RecurrentItem } from "contexts";

export const AllItemsRightSidebarReactTab = ({ app }: { app: App }) => {
	const [selectedItem, setSelectedItem] = useState<RecurrentItem>();

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setAction={() => {}}
					item={selectedItem}
				/>
			)}
			<RightSidebarReactTab title="All Items" subtitle>
				<RecurrentItemsList
				// setSelectedItem={setSelectedItem}
				// budgetItems={budget.onlyRecurrent().items.map((item) => ({
				// 	item,
				// 	dates: [item.nextDate],
				// }))}
				// onRecord={onRecord}
				/>
			</RightSidebarReactTab>
		</>
	);
};
