import { useState } from "react";
import { Budget } from "budget/Budget";
import { BudgetItem } from "budget/BudgetItem";
import {
	SectionSelection,
	RecurrentItemsSectionButtons,
} from "./RecurrentItemsSectionButtons";
import { AllItemsRightSidebarReactTab } from "./Tabs/AllItemsRightSidebarReactView";
import { CalendarRightSidebarReactTab } from "./Tabs/CalendarRightSidebarReactView";
import { App } from "obsidian";

export const RecurrentItemsSection = ({
	budget,
	onRecord,
	refresh,
	app,
}: {
	budget: Budget;
	onRecord: (item: BudgetItem) => void;
	refresh: () => void;
	app: App;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SectionSelection>("calendar");

	return (
		<>
			<h1>Recurrent Items</h1>
			<RecurrentItemsSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "calendar" && (
				<CalendarRightSidebarReactTab
					budget={budget.orderByNextDate()}
					onRecord={onRecord}
					app={app}
				/>
			)}
			{sectionSelection === "list" && (
				<AllItemsRightSidebarReactTab
					budget={budget.orderByNextDate()}
					onRecord={onRecord}
					app={app}
				/>
			)}
		</>
	);
};
