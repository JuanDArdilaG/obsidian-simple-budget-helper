import { createContext, useState } from "react";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { SectionButtons, SidebarSections } from "./SectionButtons";
import { RecurrentItemsSection } from "./RecurrentItemsSection/RecurrentItemsSection";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import { App } from "obsidian";
import { DEFAULT_SETTINGS } from "SettingTab";
import { SimpleBudgetHelperSettings } from "../../../SettingTab";
import { EditBudgetItemRecordModalRoot } from "modals/CreateBudgetItemModal/EditBudgetItemRecordModalRoot";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export const SettingsContext = createContext(DEFAULT_SETTINGS);
export const FileOperationsContext = createContext({
	updateItemFile: async (
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
	categories,
	statusBarAddText,
}: {
	getBudget: (app: App, rootFolder: string) => Promise<Budget<BudgetItem>>;
	budget: Budget<BudgetItem>;
	categories: string[];
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

	return (
		<LocalizationProvider dateAdapter={AdapterDayjs}>
			<SettingsContext.Provider value={settings}>
				<FileOperationsContext.Provider
					value={{ updateItemFile, refresh }}
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
								refresh={refresh}
								budget={budget.onlyRecurrent()}
								onRecord={onRecord}
								app={app}
							/>
						)}
						{sectionSelection === "accounting" && (
							<AccountingSection
								app={app}
								statusBarAddText={statusBarAddText}
								editModal={
									new EditBudgetItemRecordModalRoot(
										app,
										budget,
										async (item) =>
											await updateItemFile(
												item,
												"modify"
											),
										categories
									)
								}
								budget={budget.orderByNextDate()}
							/>
						)}
					</BudgetContext.Provider>
				</FileOperationsContext.Provider>
			</SettingsContext.Provider>
		</LocalizationProvider>
	);
};
