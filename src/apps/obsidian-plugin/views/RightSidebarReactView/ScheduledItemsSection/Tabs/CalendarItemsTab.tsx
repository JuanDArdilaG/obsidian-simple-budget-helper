import { useContext, useEffect, useState } from "react";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { BudgetItemsListContextMenu } from "../BudgetItemsListContextMenu";
import { Item, ItemDate } from "contexts/Items/domain";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { GetItemsUntilDateUseCaseOutput } from "contexts/Items/application/get-items-until-date.usecase";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { ItemsContext } from "../../Contexts/ItemsContext";
import { CalendarItemsList } from "./CalendarItemsList";

export const CalendarItemsTab = () => {
	const { logger } = useLogger("CalendarRightSidebarReactTab");
	const {
		useCases: { getItemsUntilDate },
	} = useContext(ItemsContext);

	const { DateInput: UntilDateFilterInput, date: untilDateFilter } =
		useDateInput({
			id: "untilDateFilter",
			initialValue: new Date(
				new Date().setMonth(new Date().getMonth() + 1)
			),
		});

	const [selectedItem, setSelectedItem] = useState<Item>();
	const [action, setAction] = useState<"edit" | "record">();

	const [items, setItems] = useState<GetItemsUntilDateUseCaseOutput>([]);
	const [updateItemsUntilDate, setUpdateItemsUntilDate] = useState(true);

	useEffect(() => {
		setUpdateItemsUntilDate(true);
	}, [untilDateFilter]);

	useEffect(() => {
		if (updateItemsUntilDate) {
			getItemsUntilDate
				.execute(new ItemDate(untilDateFilter))
				.then((items) => {
					logger.debug("getItemsUntilDate", {
						untilDateFilter,
						items,
					});
					setItems(items);
				});
			setUpdateItemsUntilDate(false);
		}
	}, [updateItemsUntilDate]);

	return (
		<>
			{selectedItem && (
				<BudgetItemsListContextMenu
					setAction={setAction}
					item={selectedItem}
				/>
			)}
			<RightSidebarReactTab title={"Upcoming Schedules"} subtitle>
				<div style={{ width: "40%", margin: "15px auto" }}>
					{UntilDateFilterInput}
				</div>
				<CalendarItemsList
					items={items}
					selectedItem={selectedItem}
					setSelectedItem={setSelectedItem}
					action={action}
					setAction={setAction}
					updateItems={() => setUpdateItemsUntilDate(true)}
				/>
			</RightSidebarReactTab>
		</>
	);
};
