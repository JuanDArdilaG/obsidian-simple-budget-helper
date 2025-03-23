import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { BudgetItemsList } from "../BudgetItemsList";
import { App } from "obsidian";
import { useState } from "react";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { RecurrentItem } from "contexts";

export const AllItemsRightSidebarReactTab = ({
	onRecord,
	app,
}: {
	onRecord: (item: RecurrentItem) => void;
	app: App;
}) => {
	const [selectedItem, setSelectedItem] = useState<RecurrentItem>();

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setEditionIsActive={() => {}}
					item={selectedItem}
				/>
			)}
			<RightSidebarReactTab title="All Items" subtitle>
				<BudgetItemsList
					editionIsActive={false}
					// setSelectedItem={setSelectedItem}
					// budgetItems={budget.onlyRecurrent().items.map((item) => ({
					// 	item,
					// 	dates: [item.nextDate],
					// }))}
					// onRecord={onRecord}
					totalPerMonth
				/>
			</RightSidebarReactTab>
		</>
	);
};
