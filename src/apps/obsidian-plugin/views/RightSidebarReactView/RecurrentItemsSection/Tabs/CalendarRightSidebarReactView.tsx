import { useState } from "react";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { RecurrentItemsList } from "../RecurrentItemsList";
import { CalendarTimeframe, TimeframeButtons } from "../TimeframeButtons";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { RecurrentItem } from "contexts/Items";

export const CalendarRightSidebarReactTab = ({}: {}) => {
	const [timeframe, setTimeframe] = useState<CalendarTimeframe>("3days");

	const [selectedItem, setSelectedItem] = useState<RecurrentItem>();
	const [action, setAction] = useState<"edit" | "record">();

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setAction={setAction}
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
				<RecurrentItemsList
					timeframe={timeframe}
					selectedItem={selectedItem}
					setSelectedItem={setSelectedItem}
					action={action}
					setAction={setAction}
				/>
			</RightSidebarReactTab>
		</>
	);
};
