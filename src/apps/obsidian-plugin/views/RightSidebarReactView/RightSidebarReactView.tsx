import { useEffect, useState } from "react";
import {
	SectionButtons,
	MainSidebarSections,
} from "../../components/SectionButtons";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { AwilixContainer } from "awilix";
import { AppProviders } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import {
	AccountsList,
	ScheduledItemsSection,
} from "apps/obsidian-plugin/views";
import { DBSection } from "./DBSection";
import { CategoriesList } from "./AccountingSection/CategoriesList";

export const RightSidebarReactView = ({
	container,
	statusBarAddText,
	plugin,
}: {
	container: AwilixContainer<any>;
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
		<AppProviders container={container} plugin={plugin}>
			<SectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "scheduledItems" && <ScheduledItemsSection />}
			{sectionSelection === "accounting" && (
				<AccountingSection
					app={plugin.app}
					statusBarAddText={statusBarAddText}
				/>
			)}
			{sectionSelection === "accounts" && <AccountsList />}
			{sectionSelection === "categories" && <CategoriesList />}
			{sectionSelection === "DB" && <DBSection />}
		</AppProviders>
	);
};
