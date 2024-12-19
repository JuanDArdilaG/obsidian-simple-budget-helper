import { useEffect, useState } from "react";
import { RightSidebarReactTab } from "./RightSidebarReactTab";
import {
	CalendarTimeframe,
	TimeframeButtons,
} from "./components/TimeframeButtons";
import { BudgetItem } from "../../BudgetItem";
import { Budget } from "../../Budget";
import { BudgetItemsList } from "./BudgetItemsList";

export const CalendarRightSidebarReactTab = ({
	budget,
}: {
	budget: Budget;
}) => {
	const [timeframe, setTimeframe] = useState<CalendarTimeframe>("3days");
	const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(
		budget.getNDaysItems(3)
	);

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
	}, [timeframe]);

	return (
		<>
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
			/>
			<TimeframeButtons selected={timeframe} setSelected={setTimeframe} />
			<BudgetItemsList budgetItems={budgetItems} />
		</>
	);
};
