import { useContext, useEffect, useState } from "react";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemsList } from "../BudgetItemsList";
import { CalendarTimeframe, TimeframeButtons } from "../TimeframeButtons";
import { App } from "obsidian";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { SettingsContext } from "../../RightSidebarReactView";

export const CalendarRightSidebarReactTab = ({
	budget,
	onRecord,
	app,
}: {
	budget: Budget<BudgetItem>;
	onRecord: (item: BudgetItem) => void;
	app: App;
}) => {
	const [timeframe, setTimeframe] = useState<CalendarTimeframe>("3days");
	const [budgetItems, setBudgetItems] = useState<
		{ item: BudgetItemRecurrent; dates: Date[] }[]
	>([]);

	const settings = useContext(SettingsContext);
	const [selectedItem, setSelectedItem] = useState<BudgetItemRecurrent>();
	const [editionIsActive, setEditionIsActive] = useState(false);

	useEffect(() => {
		setBudgetItems(
			budget.getNDaysItems(
				timeframe === "month"
					? 30
					: timeframe === "2weeks"
					? 14
					: timeframe === "week"
					? 7
					: 3
			)
		);
	}, [budget, timeframe]);

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setEditionIsActive={setEditionIsActive}
					item={selectedItem}
					openFile={async () => {
						if (selectedItem.path) {
							const leaf = app.workspace.getLeaf(
								settings.openInNewTab
							);
							const file = app.vault.getFileByPath(
								selectedItem.path
							);
							if (!file) return;
							await leaf.openFile(file);
						}
					}}
				/>
			)}
			<RightSidebarReactTab
				title={`Upcoming Next ${
					timeframe === "month"
						? "Month"
						: timeframe === "2weeks"
						? "2 Weeks"
						: timeframe === "week"
						? "Week"
						: "3 Days"
				}`}
				subtitle
			>
				<TimeframeButtons
					selected={timeframe}
					setSelected={setTimeframe}
				/>
				<BudgetItemsList
					editionIsActive={editionIsActive}
					setEditionIsActive={setEditionIsActive}
					budgetItems={budgetItems}
					onRecord={onRecord}
					selectedItem={selectedItem}
					setSelectedItem={setSelectedItem}
				/>
			</RightSidebarReactTab>
		</>
	);
};
