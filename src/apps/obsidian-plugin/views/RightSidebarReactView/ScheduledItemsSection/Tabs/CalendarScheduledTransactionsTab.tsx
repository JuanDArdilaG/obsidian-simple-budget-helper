import { DateValueObject } from "@juandardilag/value-objects";
import { useDateInput } from "apps/obsidian-plugin/components/Input/useDateInput";
import { useLogger } from "apps/obsidian-plugin/hooks";
import { CategoryID } from "contexts/Categories/domain";
import { Nanoid } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { useEffect, useState } from "react";
import { ItemRecurrenceInfo } from "../../../../../../contexts/ScheduledTransactions/domain";
import { CalendarTimeframe, TimeframeButtons } from "../TimeframeButtons";
import { CalendarScheduledTransactionsList } from "./CalendarScheduledTransactionsList";

// Filter types
interface FilterState {
	searchText: string;
	selectedCategory: CategoryID | null;
	selectedSubCategory: SubCategoryID | null;
	selectedAccount: Nanoid | null;
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

export const CalendarScheduledTransactionsTab = () => {
	const { logger } = useLogger("CalendarScheduledTransactionsTab");

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
		scheduleTransactionId: Nanoid;
	}>();

	const [timeframe, setTimeframe] = useState<CalendarTimeframe>("3days");

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
				new Date().getMonth() + 1,
			);
		if (timeframe === "3months")
			date = DateValueObject.createNowDate().updateMonth(
				new Date().getMonth() + 3,
			);
		if (timeframe === "year")
			date = DateValueObject.createNowDate().updateMonth(
				new Date().getMonth() + 12,
			);
		if (timeframe === "3years")
			date = DateValueObject.createNowDate().updateMonth(
				new Date().getMonth() + 36,
			);

		// Set the time to 23:59:59 for the calculated date
		const dateWithEndTime = new Date(date);
		dateWithEndTime.setHours(23, 59, 59, 999);

		setUntilDate(dateWithEndTime);
		setUntilDateFilter(dateWithEndTime);
	}, [timeframe]);

	return (
		<>
			<div style={{ display: "flex", justifyContent: "center" }}>
				{UntilDateFilterInput}
			</div>
			<TimeframeButtons selected={timeframe} setSelected={setTimeframe} />
			<CalendarScheduledTransactionsList
				untilDate={untilDate}
				selectedItem={selectedItem}
				setSelectedItem={setSelectedItem}
				filters={filters}
				setFilters={setFilters}
				showFilters={showFilters}
				setShowFilters={setShowFilters}
			/>
		</>
	);
};
