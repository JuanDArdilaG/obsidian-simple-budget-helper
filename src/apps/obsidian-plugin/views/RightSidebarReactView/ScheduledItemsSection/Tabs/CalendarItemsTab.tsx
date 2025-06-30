import { DateValueObject } from "@juandardilag/value-objects";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { GetItemsUntilDateUseCaseOutput } from "contexts/Items/application/get-items-until-date.usecase";
import { ItemDate, ItemID, ItemRecurrenceInfo } from "contexts/Items/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { useContext, useEffect, useState } from "react";
import { ItemsContext } from "../../Contexts/ItemsContext";
import { RightSidebarReactTab } from "../../RightSidebarReactTab";
import { CalendarTimeframe, TimeframeButtons } from "../TimeframeButtons";
import { CalendarItemsList } from "./CalendarItemsList";

// Filter types
interface FilterState {
	searchText: string;
	selectedCategory: CategoryID | null;
	selectedSubCategory: SubCategoryID | null;
	selectedAccount: AccountID | null;
	selectedOperationType: "income" | "expense" | "transfer" | "all";
	selectedTags: string[];
	priceRange: {
		min: number | null;
		max: number | null;
	};
}

const initialFilterState: FilterState = {
	searchText: "",
	selectedCategory: null,
	selectedSubCategory: null,
	selectedAccount: null,
	selectedOperationType: "all",
	selectedTags: [],
	priceRange: {
		min: null,
		max: null,
	},
};

export const CalendarItemsTab = () => {
	const { logger } = useLogger("CalendarRightSidebarReactTab");
	const {
		useCases: { getItemsUntilDate },
	} = useContext(ItemsContext);

	// Filter state - lifted up to persist across timeframe/date changes
	const [filters, setFilters] = useState<FilterState>(initialFilterState);
	const [showFilters, setShowFilters] = useState(false);

	const [untilDate, setUntilDate] = useState<Date>(() => {
		const initialDate = DateValueObject.createNowDate()
			.updateDay(1)
			.updateMonth(new Date().getMonth() + 1)
			.addDays(-1);
		const dateWithEndTime = new Date(initialDate);
		dateWithEndTime.setHours(23, 59, 59, 999);
		return dateWithEndTime;
	});
	const {
		DateInput: UntilDateFilterInput,
		date: untilDateFilter,
		setDate: setUntilDateFilter,
	} = useDateInput({
		id: "untilDateFilter",
		initialValue: untilDate,
		withTime: false,
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

	// Set the time to 23:59:59 whenever the date changes
	useEffect(() => {
		const dateWithEndTime = new Date(untilDateFilter);
		dateWithEndTime.setHours(23, 59, 59, 999);
		if (dateWithEndTime.getTime() !== untilDateFilter.getTime()) {
			setUntilDateFilter(dateWithEndTime);
		}
	}, [untilDateFilter, setUntilDateFilter]);

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

		// Set the time to 23:59:59 for the calculated date
		const dateWithEndTime = new Date(date);
		dateWithEndTime.setHours(23, 59, 59, 999);

		setUntilDate(dateWithEndTime);
		setUntilDateFilter(dateWithEndTime);
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
				filters={filters}
				setFilters={setFilters}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
			/>
		</RightSidebarReactTab>
	);
};
