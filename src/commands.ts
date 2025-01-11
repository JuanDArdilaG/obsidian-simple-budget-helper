import { Budget } from "budget/Budget/Budget";
import { BudgetItemMDFormatter } from "budget/BudgetItem/BudgetItemMDFormatter";
import SimpleBudgetHelperPlugin from "main";
import { CreateBudgetItemModalRoot } from "modals/CreateBudgetItemModal/CreateBudgetItemModalRoot";

export class Commands {
	static CreateBudgetItemModal(
		plugin: SimpleBudgetHelperPlugin,
		categories: string[]
	) {
		plugin.addCommand({
			id: "display-create-budget-item-modal",
			name: "Create budget item",
			callback: () => {
				new CreateBudgetItemModalRoot(
					plugin.app,
					[...categories, "-- create new --"].sort(),
					async (item) => {
						if (item.isRecurrent) {
							await plugin.app.vault.create(
								`${plugin.settings.rootFolder}/${item.filePath}`,
								new BudgetItemMDFormatter(item).toMarkdown()
							);
							return;
						}
						const simpleBudget =
							await Budget.loadSimpleTransactions(
								plugin.app.vault,
								plugin.settings.rootFolder
							);

						simpleBudget.addItems(item);

						await simpleBudget.saveSimpleTransactions(
							plugin.app.vault,
							plugin.settings.rootFolder
						);
					}
				).open();
			},
		});
	}
}
