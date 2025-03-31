import { useContext, useEffect, useState } from "react";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { CalendarScheduledItemsList } from "./CalendarScheduledItemsList";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import {
	ScheduledItem,
	ScheduledItemNextDate,
} from "contexts/ScheduledItems/domain";
import { ItemsContext } from "../..";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { GetScheduledItemsUntilDateUseCaseOutput } from "contexts/ScheduledItems/application/get-scheduled-items-until-date.usecase";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";

export const CalendarScheduledItemsTab = ({}: {}) => {
	const { logger } = useLogger("CalendarRightSidebarReactTab");
	const {
		useCases: { getScheduledItemsUntilDate },
	} = useContext(ItemsContext);

	const { DateInput: UntilDateFilterInput, date: untilDateFilter } =
		useDateInput({
			id: "untilDateFilter",
			initialValue: new Date(
				new Date().setMonth(new Date().getMonth() + 1)
			),
		});
	// const [timeframe, setTimeframe] = useState<CalendarTimeframe>("3days");

	const [selectedItem, setSelectedItem] = useState<ScheduledItem>();
	const [action, setAction] = useState<"edit" | "record">();

	const [items, setItems] = useState<GetScheduledItemsUntilDateUseCaseOutput>(
		[]
	);
	const [updateItems, setUpdateItems] = useState(true);

	useEffect(() => {
		if (updateItems)
			getScheduledItemsUntilDate
				.execute(new ScheduledItemNextDate(untilDateFilter))
				.then((items) => {
					logger
						.debugB("getScheduledItemsUntilDate", {
							untilDateFilter,
							items,
						})
						.log();
					setItems(items);
				});
	}, [untilDateFilter, updateItems]);

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setAction={setAction}
					item={selectedItem}
				/>
			)}
			<RightSidebarReactTab title={"Upcoming Schedules"} subtitle>
				<div style={{ display: "flex", justifyContent: "center" }}>
					{UntilDateFilterInput}
				</div>
				{/* <TimeframeButtons
					selected={timeframe}
					setSelected={setTimeframe}
				/> */}
				<CalendarScheduledItemsList
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
