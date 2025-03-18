import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";

export const useCommands = ({
	plugin,
	budget,
	updateFiles,
}: {
	plugin: SimpleBudgetHelperPlugin;
	budget: Budget<BudgetItem>;
	updateFiles: (
		item: BudgetItem,
		operation: "add" | "remove"
	) => Promise<void>;
}) => {
	// useEffect(() => {
	// 	plugin.addCommand({
	// 		id: "display-create-budget-item-modal",
	// 		name: "Create budget item",
	// 		callback: async () => {
	// 			new CreateBudgetItemModalRoot(
	// 				plugin.app,
	// 				budget,
	// 				async (item) => {
	// 					await updateFiles(item, "add");
	// 				}
	// 			).open();
	// 		},
	// 	});
	// }, [plugin, budget, updateFiles]);
};
