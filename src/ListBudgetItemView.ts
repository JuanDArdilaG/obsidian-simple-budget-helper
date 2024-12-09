import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { LIST_BUDGET_ITEMS_VIEW, PLUGIN_INFO } from "./constants";
import { BudgetItem } from "./BudgetItem";
import { PriceValueObject } from "./PriceValueObject/PriceValueObject";

export class ListBudgetItemView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return LIST_BUDGET_ITEMS_VIEW.type;
	}

	getDisplayText() {
		return "Example view";
	}

	async onOpen() {
		const { vault } = this.app;
		const container = this.containerEl.children[1];

		container.empty();
		container.createEl("h4", { text: "Budget Items" });

		const folder = vault.getFolderByPath(PLUGIN_INFO.rootFolder);
		if (!folder) return;
		let total = 0;
		for (const file of folder.children) {
			if (file instanceof TFile) {
				const fileContent = await vault.cachedRead(file);
				console.log({
					fileName: file.name,
					fileContent,
					bi: BudgetItem.fromRawMarkdown(fileContent),
				});
				const budgetItem = BudgetItem.fromRawMarkdown(fileContent);
				const listEl = container.createEl("ul");
				const perMonth = budgetItem.perMonthAmount;
				listEl.createEl("li", {
					text: `name: ${
						budgetItem.name
					}. per month: ${PriceValueObject.fromString(
						perMonth.toString()
					).toString()}`,
				});
				container.createEl("hr");
				total += perMonth;
			}
		}

		container.createEl("h6", {
			text: `Total: ${PriceValueObject.fromString(
				total.toString()
			).toString()}`,
		});
	}

	async onClose() {
		// Nothing to clean up.
	}
}
