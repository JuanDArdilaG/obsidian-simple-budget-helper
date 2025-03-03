import { createContext, useState, useMemo } from "react";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { SectionButtons, SidebarSections } from "./SectionButtons";
import { RecurrentItemsSection } from "./RecurrentItemsSection/RecurrentItemsSection";
import { AccountingSection } from "./AccountingSection/AccountingSection";
import { DEFAULT_SETTINGS } from "SettingTab";
import { useCommands } from "./useCommands";
import SimpleBudgetHelperPlugin from "main";
import { CreateBudgetItemPanel } from "modals/CreateBudgetItemModal/CreateBudgetItemPanel";
import { ActionButtons } from "./ActionButtons";

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
	onRecord,
	refresh,
	statusBarAddText,
	plugin,
}: {
	budget: Budget<BudgetItem>;
	onRecord: (item: BudgetItem) => void;
	plugin: SimpleBudgetHelperPlugin;
	refresh: () => Promise<void>;
	statusBarAddText: (val: string | DocumentFragment) => void;
}) => {
	useCommands({
		plugin,
		budget,
		updateFiles: plugin._updateItemInFile,
	});
	const [sectionSelection, setSectionSelection] =
		useState<SidebarSections>("accounting");

	const [innerBudget, setInnerBudget] = useState(budget);

	const updateBudget = async () => {
		setInnerBudget(
			await plugin._getBudget(plugin.app, plugin.settings.rootFolder)
		);
	};

	const onlyRecurrent = useMemo(
		() => innerBudget.onlyRecurrent(),
		[innerBudget]
	);
	const orderedBudget = useMemo(
		() => innerBudget.orderByNextDate(),
		[innerBudget]
	);

	const [showCreateForm, setShowCreateForm] = useState(false);

	return (
		<SettingsContext.Provider value={plugin.settings}>
			<FileOperationsContext.Provider
				value={{
					itemOperations: (item, operation) =>
						plugin._updateItemInFile(item, operation),
					refresh: async () => {
						await updateBudget();
					},
				}}
			>
				<BudgetContext.Provider
					value={{ budget: innerBudget, updateBudget }}
				>
					<ActionButtons
						refresh={refresh}
						create={async () => setShowCreateForm(!showCreateForm)}
						isCreating={showCreateForm}
					/>
					{showCreateForm && (
						<CreateBudgetItemPanel
							budget={innerBudget}
							onSubmit={async (item) => {
								await plugin._updateItemInFile(item, "add");
								await updateBudget();
							}}
							close={() => setShowCreateForm(false)}
						/>
					)}
					<SectionButtons
						selected={sectionSelection}
						setSelected={setSectionSelection}
					/>

					{sectionSelection === "recurrentItems" && (
						<RecurrentItemsSection
							budget={onlyRecurrent}
							onRecord={onRecord}
							app={plugin.app}
						/>
					)}
					{sectionSelection === "accounting" && (
						<AccountingSection
							app={plugin.app}
							statusBarAddText={statusBarAddText}
							budget={orderedBudget}
						/>
					)}
				</BudgetContext.Provider>
			</FileOperationsContext.Provider>
		</SettingsContext.Provider>
	);
};
