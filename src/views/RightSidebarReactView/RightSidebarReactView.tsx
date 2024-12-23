import { useState } from "react";
import { Budget } from "budget/Budget";
import { BudgetItem } from "budget/BudgetItem";
import { SectionButtons, SidebarSections } from "./SectionButtons";
import { RecurrentItemsSection } from "./RecurrentItemsSection/RecurrentItemsSection";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import { App } from "obsidian";

export const RightSidebarReactView = ({
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
		useState<SidebarSections>("recurrentItems");

	return (
		<>
			<SectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
				refresh={refresh}
			/>

			{sectionSelection === "recurrentItems" && (
				<RecurrentItemsSection
					refresh={refresh}
					budget={budget}
					onRecord={onRecord}
					app={app}
				/>
			)}
			{sectionSelection === "accounting" && (
				<AccountingSection budget={budget.orderByNextDate()} />
			)}
		</>
	);
};
