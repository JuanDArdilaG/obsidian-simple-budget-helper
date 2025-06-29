import { DateValueObject } from "@juandardilag/value-objects";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { GetItemsUntilDateUseCaseOutput } from "contexts/Items/application/get-items-until-date.usecase";
import { ItemDate, ItemID, ItemRecurrenceInfo } from "contexts/Items/domain";
import { useContext, useEffect, useState } from "react";
import { ItemsContext } from "../../Contexts/ItemsContext";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { CalendarTimeframe, TimeframeButtons } from "../TimeframeButtons";
import { CalendarItemsList } from "./CalendarItemsList";

export const CalendarItemsTab = () => {
	const { logger } = useLogger("CalendarRightSidebarReactTab");
	const {
		useCases: { getItemsUntilDate },
	} = useContext(ItemsContext);

	const [untilDate, setUntilDate] = useState<Date>(
		DateValueObject.createNowDate()
			.updateDay(1)
			.updateMonth(new Date().getMonth() + 1)
			.addDays(-1)
	);
	const {
		DateInput: UntilDateFilterInput,
		date: untilDateFilter,
		setDate: setUntilDateFilter,
	} = useDateInput({
		id: "untilDateFilter",
		initialValue: untilDate,
	});

	const [selectedItem, setSelectedItem] = useState<{
		recurrence: ItemRecurrenceInfo;
		itemID: ItemID;
	}>();
	const [action, setAction] = useState<"edit" | "record">();

	const [items, setItems] = useState<GetItemsUntilDateUseCaseOutput>([]);
	const [timeframe, setTimeframe] = useState<CalendarTimeframe>("3days");
	const [refreshCounter, setRefreshCounter] = useState(0);

	useEffect(() => {
		setUntilDate(untilDateFilter);
	}, [untilDateFilter]);

	useEffect(() => {
		if (!timeframe) return;
		let date = DateValueObject.createNowDate();
		if (timeframe === "3days")
			date = DateValueObject.createNowDate().addDays(3);
		if (timeframe === "week")
			date = DateValueObject.createNowDate().addDays(7);
		if (timeframe === "2weeks")
			date = DateValueObject.createNowDate().addDays(14);
		if (timeframe === "month")
			date = DateValueObject.createNowDate().updateMonth(
				new Date().getMonth() + 1
			);
		if (timeframe === "3months")
			date = DateValueObject.createNowDate().updateMonth(
				new Date().getMonth() + 3
			);
		if (timeframe === "year")
			date = DateValueObject.createNowDate().updateMonth(
				new Date().getMonth() + 12
			);
		if (timeframe === "3years")
			date = DateValueObject.createNowDate().updateMonth(
				new Date().getMonth() + 36
			);

		setUntilDate(date);
		setUntilDateFilter(date);
	}, [timeframe]);

	const refreshItems = () => {
		logger.debug("refreshItems called", { untilDate });
		getItemsUntilDate.execute(new ItemDate(untilDate)).then((items) => {
			logger.debug("getItemsUntilDate returned", {
				untilDate,
				itemsCount: items.length,
				items: items.map((item) => ({
					id: item.item.id.value,
					name: item.item.name.toString(),
					recurrenceDate: item.recurrence.date.value,
					state: item.recurrence.state,
				})),
			});
			setItems(items);
			setRefreshCounter((prev) => prev + 1);
		});
	};

	useEffect(() => {
		refreshItems();
	}, [untilDate, getItemsUntilDate]);

	return (
		<RightSidebarReactTab title={"Upcoming Schedules"} subtitle>
			<div style={{ display: "flex", justifyContent: "center" }}>
				{UntilDateFilterInput}
			</div>
			<TimeframeButtons selected={timeframe} setSelected={setTimeframe} />
			<CalendarItemsList
				key={`refresh-${refreshCounter}`}
				items={items}
				untilDate={untilDate}
				selectedItem={selectedItem}
				setSelectedItem={setSelectedItem}
				action={action}
				setAction={setAction}
				updateItems={refreshItems}
			/>
		</RightSidebarReactTab>
	);
};
