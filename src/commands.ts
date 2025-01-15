import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import SimpleBudgetHelperPlugin from "main";
import { CreateBudgetItemModalRoot } from "modals/CreateBudgetItemModal/CreateBudgetItemModalRoot";

export class Commands {
	static CreateBudgetItemModal(
		plugin: SimpleBudgetHelperPlugin,
		categories: string[],
		getNewItemID: () => Promise<number>,
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
					await getNewItemID(),
					plugin.app,
					[...categories, "-- create new --"].sort(),
					async (item) => {
						await updateFiles(item, "add");
					},
					toEdit
				).open();
			},
		});
	}
}
