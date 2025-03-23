import { useState } from "react";
import {
	RecurrentItemsSectionSelection,
	RecurrentItemsSectionButtons,
} from "./RecurrentItemsSectionButtons";
import { AllItemsRightSidebarReactTab } from "./Tabs/AllItemsRightSidebarReactView";
import { CalendarRightSidebarReactTab } from "./Tabs/CalendarRightSidebarReactView";
import { App } from "obsidian";
import { RightSidebarReactTab } from "../RightSidebarReactTab";
import { PerCategoryRightSidebarReactTab } from "./PerCategoryRightSidebarReactTab";
import { RecurrentItem } from "contexts";

export const RecurrentItemsSection = ({
	onRecord,
	app,
}: {
	onRecord: (item: RecurrentItem) => void;
	app: App;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<RecurrentItemsSectionSelection>("perCategory");

	return (
		<RightSidebarReactTab title="Recurrent Items">
			<RecurrentItemsSectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "calendar" && (
				<CalendarRightSidebarReactTab onRecord={onRecord} app={app} />
			)}
			{sectionSelection === "list" && (
				<AllItemsRightSidebarReactTab onRecord={onRecord} app={app} />
			)}
			{sectionSelection === "perCategory" && (
				<PerCategoryRightSidebarReactTab />
			)}
		</RightSidebarReactTab>
	);
};
