import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { LIST_BUDGET_ITEMS_VIEW } from "./constants";
import { BudgetItem } from "./BudgetItem";
import { PriceValueObject } from "@juandardilag/value-objects/dist/PriceValueObject";
import { Budget } from "./Budget";

export class ListBudgetItemView extends ItemView {
	private _rootFolder: string;
	constructor(leaf: WorkspaceLeaf, rootFolder: string) {
		super(leaf);
		this._rootFolder = rootFolder;
	}

	getViewType() {
		return LIST_BUDGET_ITEMS_VIEW.type;
	}

	getDisplayText() {
		return LIST_BUDGET_ITEMS_VIEW.title;
	}

	async onOpen() {
		const listBtn = this.containerEl.createEl("button", {
			text: "Items",
		});
		const perCategoryBtn = this.containerEl.createEl("button", {
			text: "Per Category",
		});
		listBtn.onclick = () => {
			this.listItemsPage();
		};
		perCategoryBtn.onclick = () => {
			this.perCategoryPage();
		};
		await this.listItemsPage();
	}

	async listItemsPage() {
		const { vault } = this.app;
		const container = this.containerEl.children[1];

		container.empty();
		container.createEl("h3", { text: "Budget Items" });

		const folder = vault.getFolderByPath(this._rootFolder);
		if (!folder) return;
		const budget = new Budget([]);
		for (const file of folder.children) {
			if (file instanceof TFile) {
				const fileContent = await vault.cachedRead(file);
				console.log({
					fileName: file.name,
					fileContent,
					bi: BudgetItem.fromRawMarkdown(fileContent),
				});
				const budgetItem = BudgetItem.fromRawMarkdown(fileContent);
				budget.addItem(budgetItem);
			}
		}

		const total = budget.getTotalPerMonth();
		for (const item of budget.items) {
			const listEl = container.createEl("ul");
			const perMonth = item.perMonthAmount;
			const liEl = listEl.createEl("li");
			liEl.innerHTML = `<b>Item:</b> ${item.name}.<br/><b>Category:</b> ${
				item.category
			}.<br/><b>Per month:</b> ${PriceValueObject.fromString(
				perMonth.toString()
			).toString()} (${((perMonth / total) * 100).toFixed(2)}%)`;
			container.createEl("hr");
		}

		container.createEl("h5", {
			text: `Total: ${PriceValueObject.fromString(
				total.toString()
			).toString()}`,
		});
	}

	async perCategoryPage() {
		const { vault } = this.app;
		const container = this.containerEl.children[1];

		container.empty();
		container.createEl("h3", { text: "Per Category Budget Items" });

		const folder = vault.getFolderByPath(this._rootFolder);
		if (!folder) return;
		const budget = new Budget([]);
		const perCategory: Record<string, Budget> = {};
		for (const file of folder.children) {
			if (file instanceof TFile) {
				const fileContent = await vault.cachedRead(file);
				const budgetItem = BudgetItem.fromRawMarkdown(fileContent);
				if (!perCategory[budgetItem.category]) {
					perCategory[budgetItem.category] = new Budget([]);
				}
				perCategory[budgetItem.category].addItem(budgetItem);
				budget.addItem(budgetItem);
			}
		}

		let total = budget.getTotalPerMonth();
		for (const category in perCategory) {
			const perCategoryBudget = perCategory[category];
			const perCategoryTotal = perCategoryBudget.getTotalPerMonth();
			container.createEl("h4", {
				text: `${category} (${(
					(perCategoryTotal / total) *
					100
				).toFixed(2)}%)`,
			});
			const listEl = container.createEl("ul");
			for (const item of perCategoryBudget.items) {
				const liEl = listEl.createEl("li");
				liEl.innerHTML = `<b>Item:</b> ${
					item.name
				}.<br/><b>Per month:</b> ${PriceValueObject.fromString(
					item.perMonthAmount.toString()
				).toString()} (${(
					(item.perMonthAmount / perCategoryTotal) *
					100
				).toFixed(2)}%)`;
			}
			container.createEl("h5", {
				text: `Total: ${PriceValueObject.fromString(
					perCategoryTotal.toString()
				).toString()}`,
			});
			container.createEl("hr");
		}

		container.createEl("h4", {
			text: `Total: ${PriceValueObject.fromString(
				total.toString()
			).toString()}`,
		});
	}

	async onClose() {
		// Nothing to clean up.
	}
}
