import { useEffect, useState } from "react";
import {
	SectionButtons,
	MainSidebarSections,
} from "../../components/SectionButtons";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { ActionButtons } from "../../components/ActionButtons";
import { CreateItemPanel } from "apps/obsidian-plugin/panels";
import { AwilixContainer } from "awilix";
import { AppProviders } from "apps/obsidian-plugin/views/RightSidebarReactView/Contexts";
import { RecurrentItemsSection } from "apps/obsidian-plugin/views";

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
		plugin.settings.lastTab.main = sectionSelection;
		plugin.saveSettings();
	}, [sectionSelection]);
	const [showCreateForm, setShowCreateForm] = useState(false);

	return (
		<AppProviders container={container} plugin={plugin}>
			<ActionButtons
				handleCreateClick={async () =>
					setShowCreateForm(!showCreateForm)
				}
				isCreating={showCreateForm}
			/>
			{showCreateForm && (
				<CreateItemPanel close={() => setShowCreateForm(false)} />
			)}
			<SectionButtons
				selected={sectionSelection}
				setSelected={setSectionSelection}
			/>

			{sectionSelection === "recurrentItems" && (
				<RecurrentItemsSection app={plugin.app} />
			)}
			{sectionSelection === "accounting" && (
				<AccountingSection
					app={plugin.app}
					statusBarAddText={statusBarAddText}
				/>
			)}
		</AppProviders>
	);
};
