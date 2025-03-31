import { useContext, useEffect, useState } from "react";
import { AllScheduledItemsTab } from "./Tabs/AllScheduledItemsTab";
import { CalendarScheduledItemsTab } from "./Tabs/CalendarScheduledItemsTab";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { AppContext } from "../Contexts";
import { ActionButtons } from "apps/obsidian-plugin/components/ActionButtons";
import { CreateScheduledItemPanel } from "apps/obsidian-plugin/panels";
import {
	ScheduledItemsSectionSelection,
	ScheduledItemsSectionButtons,
} from "./ScheduledItemsSectionButtons";
import { PerCategoryScheduledItemsTab } from "./Tabs";

export const ScheduledItemsSection = () => {
	const { plugin } = useContext(AppContext);
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
		<RightSidebarReactTab title="Scheduled Items">
			<ActionButtons
				handleCreateClick={async () =>
					setShowCreateForm(!showCreateForm)
				}
				isCreating={showCreateForm}
			/>
			{showCreateForm && (
				<CreateScheduledItemPanel
					close={() => setShowCreateForm(false)}
				/>
			)}
			<ScheduledItemsSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "calendar" && <CalendarScheduledItemsTab />}
			{sectionSelection === "list" && <AllScheduledItemsTab />}
			{sectionSelection === "perCategory" && (
				<PerCategoryScheduledItemsTab />
			)}
		</RightSidebarReactTab>
	);
};
