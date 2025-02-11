import { createContext, useState, useMemo } from "react";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { SectionButtons, SidebarSections } from "./SectionButtons";
import { RecurrentItemsSection } from "./RecurrentItemsSection/RecurrentItemsSection";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import { App } from "obsidian";
import { DEFAULT_SETTINGS } from "SettingTab";
import { SimpleBudgetHelperSettings } from "../../../SettingTab";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export const SettingsContext = createContext(DEFAULT_SETTINGS);
export const FileOperationsContext = createContext({
	itemOperations: async (
		item: BudgetItem,
		operation: "add" | "modify" | "remove"
	) => {},
	refresh: async () => {},
});
export const BudgetContext = createContext({
	budget: new Budget<BudgetItem>([]),
	updateBudget: async () => {},
});

export const RightSidebarReactView = ({
	budget,
	getBudget,
	onRecord,
	updateItemFile,
	refresh,
	app,
	settings,
	statusBarAddText,
}: {
	getBudget: (app: App, rootFolder: string) => Promise<Budget<BudgetItem>>;
	budget: Budget<BudgetItem>;
	onRecord: (item: BudgetItem) => void;
	updateItemFile: (
		item: BudgetItem,
		operation: "add" | "modify" | "remove"
	) => Promise<void>;
	refresh: () => Promise<void>;
	app: App;
	settings: SimpleBudgetHelperSettings;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	const [sectionSelection, setSectionSelection] =
		useState<SidebarSections>("recurrentItems");

	const [innerBudget, setInnerBudget] = useState(budget);

	const updateBudget = async () => {
		setInnerBudget(await getBudget(app, settings.rootFolder));
	};

	const onlyRecurrent = useMemo(
		() => innerBudget.onlyRecurrent(),
		[innerBudget]
	);
	const orderedBudget = useMemo(
		() => innerBudget.orderByNextDate(),
		[innerBudget]
	);

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<SettingsContext.Provider value={settings}>
				<FileOperationsContext.Provider
					value={{ itemOperations: updateItemFile, refresh }}
				>
					<BudgetContext.Provider
						value={{ budget: innerBudget, updateBudget }}
					>
						<SectionButtons
							selected={sectionSelection}
							setSelected={setSectionSelection}
							refresh={refresh}
						/>

						{sectionSelection === "recurrentItems" && (
							<RecurrentItemsSection
								budget={onlyRecurrent}
								onRecord={onRecord}
								app={app}
							/>
						)}
						{sectionSelection === "accounting" && (
							<AccountingSection
								app={app}
								statusBarAddText={statusBarAddText}
								budget={orderedBudget}
							/>
						)}
					</BudgetContext.Provider>
				</FileOperationsContext.Provider>
			</SettingsContext.Provider>
		</LocalizationProvider>
	);
};
