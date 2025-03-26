import { useContext, useEffect, useState } from "react";
import {
	RecurrentItemsSectionSelection,
	RecurrentItemsSectionButtons,
} from "./RecurrentItemsSectionButtons";
import { AllItemsRightSidebarReactTab } from "./Tabs/AllItemsRightSidebarReactView";
import { CalendarRightSidebarReactTab } from "./Tabs/CalendarRightSidebarReactView";
import { App } from "obsidian";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { PerCategoryRightSidebarReactTab } from "./PerCategoryRightSidebarReactTab";
import { AppContext } from "../Contexts/";

export const RecurrentItemsSection = ({ app }: { app: App }) => {
	const { plugin } = useContext(AppContext);
	const [sectionSelection, setSectionSelection] =
		useState<RecurrentItemsSectionSelection>("calendar");
	useEffect(() => {
		plugin.settings.lastTab.recurrent = sectionSelection;
		plugin.saveSettings();
	}, [sectionSelection]);

	return (
		<RightSidebarReactTab title="Recurrent Items">
			<RecurrentItemsSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "calendar" && (
				<CalendarRightSidebarReactTab />
			)}
			{sectionSelection === "list" && (
				<AllItemsRightSidebarReactTab app={app} />
			)}
			{sectionSelection === "perCategory" && (
				<PerCategoryRightSidebarReactTab />
			)}
		</RightSidebarReactTab>
	);
};
