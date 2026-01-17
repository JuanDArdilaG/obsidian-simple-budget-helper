import { CreateScheduledTransactionPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel";
import { useContext, useEffect, useState } from "react";
import { AppContext, ScheduledTransactionsContext } from "../Contexts";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import {
	ScheduledItemsSectionButtons,
	ScheduledItemsSectionSelection,
} from "./ScheduledItemsSectionButtons";
import { PerCategoryItemsTab } from "./Tabs";
import { AllScheduledTransactionsTab } from "./Tabs/AllScheduledTransactionsTab";
import { CalendarItemsTab } from "./Tabs/CalendarItemsTab";
import { ScheduledTransactionsSummary } from "./Tabs/ScheduledTransactionsSummary/ScheduledTransactionsSummary";

export const ScheduledItemsSection = () => {
	const { plugin } = useContext(AppContext);
	const { updateScheduledTransactions } = useContext(
		ScheduledTransactionsContext
	);
	const [sectionSelection, setSectionSelection] =
		useState<ScheduledItemsSectionSelection>(
			plugin.settings.lastTab.scheduled
		);
	const [showCreateForm, setShowCreateForm] = useState(false);

	useEffect(() => {
		if (plugin.settings.lastTab.scheduled !== sectionSelection) {
			plugin.settings.lastTab.scheduled = sectionSelection;
			plugin.saveSettings();
		}
	}, [sectionSelection]);

	return (
		<RightSidebarReactTab
			title="Scheduled Items"
			handleCreate={async () => setShowCreateForm(!showCreateForm)}
			handleRefresh={async () => updateScheduledTransactions()}
			isCreating={showCreateForm}
		>
			{showCreateForm && (
				<CreateScheduledTransactionPanel
					close={() => setShowCreateForm(false)}
				/>
			)}
			<ScheduledItemsSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "calendar" && <CalendarItemsTab />}
			{sectionSelection === "list" && <AllScheduledTransactionsTab />}
			{sectionSelection === "summary" && <ScheduledTransactionsSummary />}
			{sectionSelection === "perCategory" && <PerCategoryItemsTab />}
		</RightSidebarReactTab>
	);
};
