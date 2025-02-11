import { useState, useMemo } from "react";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import {
	SectionSelection,
	RecurrentItemsSectionButtons,
} from "./RecurrentItemsSectionButtons";
import { AllItemsRightSidebarReactTab } from "./Tabs/AllItemsRightSidebarReactView";
import { CalendarRightSidebarReactTab } from "./Tabs/CalendarRightSidebarReactView";
import { App } from "obsidian";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";

export const RecurrentItemsSection = ({
	budget,
	onRecord,
	app,
}: {
	budget: Budget<BudgetItemRecurrent>;
	onRecord: (item: BudgetItem) => void;
	app: App;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SectionSelection>("calendar");

	const orderedBudget = useMemo(() => budget.orderByNextDate(), [budget]);

	return (
		<>
			<h1>Recurrent Items</h1>
			<RecurrentItemsSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "calendar" && (
				<CalendarRightSidebarReactTab
					budget={orderedBudget}
					onRecord={onRecord}
					app={app}
				/>
			)}
			{sectionSelection === "list" && (
				<AllItemsRightSidebarReactTab
					budget={orderedBudget}
					onRecord={onRecord}
					app={app}
				/>
			)}
		</>
	);
};
