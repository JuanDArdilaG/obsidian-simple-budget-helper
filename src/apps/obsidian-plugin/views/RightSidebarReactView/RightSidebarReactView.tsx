import { useEffect, useState } from "react";
import {
	SectionButtons,
	MainSidebarSections,
} from "../../components/SectionButtons";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { AppProviders } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	AccountsList,
	ScheduledItemsSection,
} from "apps/obsidian-plugin/views";
import { CategoriesList } from "./AccountingSection/CategoriesList";
import { LocalPersistenceSettings } from "../../components/LocalPersistenceSettings";

export const RightSidebarReactView = ({
	statusBarAddText,
	plugin,
}: {
	plugin: SimpleBudgetHelperPlugin;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<MainSidebarSections>(plugin.settings.lastTab.main);
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
			{sectionSelection === "accounts" && <AccountsList />}
			{sectionSelection === "categories" && <CategoriesList />}
			{sectionSelection === "localPersistence" && (
				<LocalPersistenceSettings plugin={plugin} />
			)}
		</AppProviders>
	);
};
