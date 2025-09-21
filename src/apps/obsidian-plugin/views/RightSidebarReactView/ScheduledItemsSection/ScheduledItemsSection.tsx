import { useContext, useEffect, useState } from "react";
import { AllItemsTab } from "./Tabs/AllItemsTab";
import { CalendarItemsTab } from "./Tabs/CalendarItemsTab";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { AppContext, ItemsContext } from "../Contexts";
import {
	ScheduledItemsSectionSelection,
	ScheduledItemsSectionButtons,
} from "./ScheduledItemsSectionButtons";
import { PerCategoryItemsTab } from "./Tabs";
import { CreateItemPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel";

export const ScheduledItemsSection = () => {
	const { plugin } = useContext(AppContext);
	const { updateItems } = useContext(ItemsContext);
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
			handleRefresh={async () => updateItems()}
			isCreating={showCreateForm}
		>
			{showCreateForm && (
				<CreateItemPanel close={() => setShowCreateForm(false)} />
			)}
			<ScheduledItemsSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "calendar" && <CalendarItemsTab />}
			{sectionSelection === "list" && <AllItemsTab />}
			{sectionSelection === "perCategory" && <PerCategoryItemsTab />}
		</RightSidebarReactTab>
	);
};
