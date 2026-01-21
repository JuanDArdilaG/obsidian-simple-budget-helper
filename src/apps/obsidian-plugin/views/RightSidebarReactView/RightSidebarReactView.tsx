import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import {
	AccountsDashboard,
	ScheduledItemsSection,
} from "apps/obsidian-plugin/views";
import { AppProviders } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { useEffect, useState } from "react";
import { LocalPersistenceSettings } from "../../components/LocalPersistenceSettings";
import {
	MainSidebarSections,
	SectionButtons,
} from "../../components/SectionButtons";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import { CategoriesList } from "./AccountingSection/CategoriesList";

export const RightSidebarReactView = ({
	statusBarAddText,
	plugin,
}: {
	plugin: SimpleBudgetHelperPlugin;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<MainSidebarSections>(plugin.settings.lastTab.main);

	// Debug logging for mobile issues
	console.log("RightSidebarReactView render:", {
		sectionSelection,
		lastTab: plugin.settings.lastTab.main,
		userAgent: navigator.userAgent,
		isMobile:
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				navigator.userAgent,
			),
	});

	useEffect(() => {
		if (plugin.settings.lastTab.main !== sectionSelection) {
			plugin.settings.lastTab.main = sectionSelection;
			plugin.saveSettings();
		}
	}, [sectionSelection]);

	return (
		<AppProviders container={plugin.container} plugin={plugin}>
			<SectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "scheduledItems" && <ScheduledItemsSection />}
			{sectionSelection === "accounting" && (
				<AccountingSection statusBarAddText={statusBarAddText} />
			)}
			{sectionSelection === "accounts" && <AccountsDashboard />}
			{sectionSelection === "categories" && <CategoriesList />}
			{sectionSelection === "localPersistence" && (
				<LocalPersistenceSettings plugin={plugin} />
			)}
		</AppProviders>
	);
};
