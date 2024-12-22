import { useState } from "react";
import { SectionButtons, SectionSelection } from "./components/SectionButtons";
import { CalendarRightSidebarReactTab } from "./Tabs/CalendarRightSidebarReactView";
import { Budget } from "src/budget/Budget";
import { BudgetItem } from "src/budget/BudgetItem";
import { AllItemsRightSidebarReactTab } from "./Tabs/AllItemsRightSidebarReactView";

export const RightSidebarReactView = ({
	rootFolder,
	budget,
	onRecord,
	refresh,
}: {
	rootFolder: string;
	budget: Budget;
	onRecord: (item: BudgetItem) => void;
	refresh: () => void;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SectionSelection>("calendar");

	return (
		<>
			<SectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
				refresh={refresh}
			/>

			{sectionSelection === "calendar" && (
				<CalendarRightSidebarReactTab
					budget={budget.orderByNextDate()}
					onRecord={onRecord}
				/>
			)}
			{sectionSelection === "list" && (
				<AllItemsRightSidebarReactTab
					budget={budget.orderByNextDate()}
					onRecord={onRecord}
				/>
			)}
		</>
	);
};
