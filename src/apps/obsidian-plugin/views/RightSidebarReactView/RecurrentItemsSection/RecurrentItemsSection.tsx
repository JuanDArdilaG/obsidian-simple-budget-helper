import { useContext, useEffect, useState } from "react";
import {
	RecurrentItemsSectionSelection,
	RecurrentItemsSectionButtons,
} from "./RecurrentItemsSectionButtons";
import { AllRecurrentItemsTab } from "./Tabs/AllRecurrentItemsTab";
import { CalendarRecurrentItemsTab } from "./Tabs/CalendarRecurrentItemsTab";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { AppContext } from "../Contexts/";
import { PerCategoryRecurrentItemsTab } from "./Tabs/PerCategoryRecurrentItemsTab";
import { ActionButtons } from "apps/obsidian-plugin/components/ActionButtons";
import { CreateRecurrentItemPanel } from "apps/obsidian-plugin/panels/CreateBudgetItemPanel/CreateRecurrentItemPanel";

export const RecurrentItemsSection = () => {
	const { plugin } = useContext(AppContext);
	const [sectionSelection, setSectionSelection] =
		useState<RecurrentItemsSectionSelection>(
			plugin.settings.lastTab.recurrent
		);
	const [showCreateForm, setShowCreateForm] = useState(false);

	useEffect(() => {
		if (plugin.settings.lastTab.recurrent !== sectionSelection) {
			plugin.settings.lastTab.recurrent = sectionSelection;
			plugin.saveSettings();
		}
	}, [sectionSelection]);

	return (
		<RightSidebarReactTab title="Recurrent Items">
			<ActionButtons
				handleCreateClick={async () =>
					setShowCreateForm(!showCreateForm)
				}
				isCreating={showCreateForm}
			/>
			{showCreateForm && (
				<CreateRecurrentItemPanel
					close={() => setShowCreateForm(false)}
				/>
			)}
			<RecurrentItemsSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "calendar" && <CalendarRecurrentItemsTab />}
			{sectionSelection === "list" && <AllRecurrentItemsTab />}
			{sectionSelection === "perCategory" && (
				<PerCategoryRecurrentItemsTab />
			)}
		</RightSidebarReactTab>
	);
};
