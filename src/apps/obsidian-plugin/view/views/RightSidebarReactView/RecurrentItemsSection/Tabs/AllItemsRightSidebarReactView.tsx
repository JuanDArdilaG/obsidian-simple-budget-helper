import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { Budget } from "budget/Budget/Budget";
import { BudgetItemsList } from "../BudgetItemsList";
import { App } from "obsidian";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { useContext, useState } from "react";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { SettingsContext } from "../../RightSidebarReactView";

export const AllItemsRightSidebarReactTab = ({
	budget,
	onRecord,
	app,
}: {
	budget: Budget<BudgetItem>;
	onRecord: (item: BudgetItem) => void;
	app: App;
}) => {
	const { openInNewTab } = useContext(SettingsContext);
	const [selectedItem, setSelectedItem] = useState<BudgetItemRecurrent>();

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setEditionIsActive={() => {}}
					item={selectedItem}
					openFile={async () => {
						if (selectedItem.path) {
							const leaf = app.workspace.getLeaf(openInNewTab);
							const file = app.vault.getFileByPath(
								selectedItem.path
							);
							if (!file) return;
							await leaf.openFile(file);
						}
					}}
				/>
			)}
			<RightSidebarReactTab title="All Items" subtitle>
				<BudgetItemsList
					editionIsActive={false}
					setSelectedItem={setSelectedItem}
					budgetItems={budget.onlyRecurrent().items.map((item) => ({
						item,
						dates: [item.nextDate],
					}))}
					onRecord={onRecord}
					totalPerMonth
				/>
			</RightSidebarReactTab>
		</>
	);
};
