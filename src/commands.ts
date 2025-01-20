import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import SimpleBudgetHelperPlugin from "main";
import { CreateBudgetItemModalRoot } from "modals/CreateBudgetItemModal/CreateBudgetItemModalRoot";

export class Commands {
	static CreateBudgetItemModal(
		plugin: SimpleBudgetHelperPlugin,
		budget: Budget<BudgetItem>,
		accounts: string[],
		updateFiles: (
			item: BudgetItem,
			operation: "add" | "remove"
		) => Promise<void>,
		toEdit?: BudgetItem
	) {
		plugin.addCommand({
			id: "display-create-budget-item-modal",
			name: "Create budget item",
			callback: async () => {
				new CreateBudgetItemModalRoot(
					plugin.app,
					budget,
					accounts,
					async (item) => {
						await updateFiles(item, "add");
					},
					toEdit
				).open();
			},
		});
	}
}
