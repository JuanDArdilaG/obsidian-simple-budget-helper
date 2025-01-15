import { createContext, useState } from "react";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { SectionButtons, SidebarSections } from "./SectionButtons";
import { RecurrentItemsSection } from "./RecurrentItemsSection/RecurrentItemsSection";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import { App } from "obsidian";
import { DEFAULT_SETTINGS } from "SettingTab";
import { SimpleBudgetHelperSettings } from "../../SettingTab";

export const SettingsContext = createContext(DEFAULT_SETTINGS);
export const FileOperationsContext = createContext({
	updateItemFile: async (item: BudgetItem, operation: "add" | "remove") => {},
	refresh: async () => {},
});

export const RightSidebarReactView = ({
	budget,
	onRecord,
	updateItemFile,
	refresh,
	app,
	settings,
}: {
	budget: Budget;
	onRecord: (item: BudgetItem) => void;
	updateItemFile: (
		item: BudgetItem,
		operation: "add" | "remove"
	) => Promise<void>;
	refresh: () => Promise<void>;
	app: App;
	settings: SimpleBudgetHelperSettings;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SidebarSections>("accounting");

	return (
		<SettingsContext.Provider value={settings}>
			<FileOperationsContext.Provider value={{ updateItemFile, refresh }}>
				<SectionButtons
					selected={sectionSelection}
					setSelected={setSectionSelection}
					refresh={refresh}
				/>

				{sectionSelection === "recurrentItems" && (
					<RecurrentItemsSection
						refresh={refresh}
						budget={budget.onlyRecurrent()}
						onRecord={onRecord}
						app={app}
					/>
				)}
				{sectionSelection === "accounting" && (
					<AccountingSection budget={budget.orderByNextDate()} />
				)}
			</FileOperationsContext.Provider>
		</SettingsContext.Provider>
	);
};
