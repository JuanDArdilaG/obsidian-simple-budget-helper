import { useContext, useEffect, useState } from "react";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { CalendarRecurrentItemsList } from "./CalendarRecurrentItemsList";
import { CalendarTimeframe, TimeframeButtons } from "../TimeframeButtons";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import {
	RecurrentItem,
	RecurrentItemNextDate,
	RecurrrentItemFrequency,
} from "contexts/Items";
import { ItemsContext } from "../..";
import { useLogger } from "apps/obsidian-plugin/hooks";

export const CalendarRecurrentItemsTab = ({}: {}) => {
	const logger = useLogger("CalendarRightSidebarReactTab", false);
	const {
		useCases: { getRecurrentItemsUntilDate },
	} = useContext(ItemsContext);

	const [timeframe, setTimeframe] = useState<CalendarTimeframe>("3days");

	const [selectedItem, setSelectedItem] = useState<RecurrentItem>();
	const [action, setAction] = useState<"edit" | "record">();

	const [items, setItems] = useState<RecurrentItem[]>([]);
	const [updateItems, setUpdateItems] = useState(true);

	useEffect(() => {
		if (updateItems)
			getRecurrentItemsUntilDate
				.execute(
					RecurrentItemNextDate.now().addDays(
						timeframe === "3years"
							? 365 * 3
							: timeframe === "year"
							? 365
							: timeframe === "3months"
							? 90
							: timeframe === "month"
							? RecurrrentItemFrequency.MONTH_DAYS_RELATION
							: timeframe === "2weeks"
							? 14
							: timeframe === "week"
							? 7
							: 3
					)
				)
				.then((items) => {
					logger
						.debugB("getRecurrentItemsUntilDate", {
							timeframe,
							items,
						})
						.log();
					setItems(items);
				});
	}, [timeframe, updateItems]);

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
				<CalendarRecurrentItemsList
					items={items}
					selectedItem={selectedItem}
					setSelectedItem={setSelectedItem}
					action={action}
					setAction={setAction}
					updateItems={() => setUpdateItems(true)}
				/>
			</RightSidebarReactTab>
		</>
	);
};
