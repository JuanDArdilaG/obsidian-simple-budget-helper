import { useContext, useState } from "react";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { BudgetItemsList } from "../BudgetItemsList";
import { CalendarTimeframe, TimeframeButtons } from "../TimeframeButtons";
import { App } from "obsidian";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { RecurrentItem } from "contexts/Items";

export const CalendarRightSidebarReactTab = ({
	onRecord,
	app,
}: {
	onRecord: (item: RecurrentItem) => void;
	app: App;
}) => {
	const [timeframe, setTimeframe] = useState<CalendarTimeframe>("3days");
	// const [budgetItems, setBudgetItems] = useState<
	// 	{ item: BudgetItemRecurrent; dates: Date[] }[]
	// >([]);

	const [selectedItem, setSelectedItem] = useState<RecurrentItem>();
	const [editionIsActive, setEditionIsActive] = useState(false);

	// useEffect(() => {
	// 	setBudgetItems(
	// 		budget.getNDaysItems(
	// 			timeframe === "month"
	// 				? 30
	// 				: timeframe === "2weeks"
	// 				? 14
	// 				: timeframe === "week"
	// 				? 7
	// 				: 3
	// 		)
	// 	);
	// }, [budget, timeframe]);

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setEditionIsActive={setEditionIsActive}
					item={selectedItem}
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
				/>
			</RightSidebarReactTab>
		</>
	);
};
