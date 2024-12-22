import { Plugin, TFile, WorkspaceLeaf } from "obsidian";
import { views } from "./constants";
import { Budget } from "./budget/Budget";
import { BudgetItem } from "./budget/BudgetItem";
import {
	DEFAULT_SETTINGS,
	SettingTab,
	SimpleBudgetHelperSettings,
} from "./SettingTab";
import { RightSidebarReactViewRoot } from "./views/RightSidebarReactView/RightSidebarReactViewRoot";
import { CreateBudgetItemModalRoot } from "./modals/CreateBudgetItemModalRoot";
import { ListBudgetItemView } from "./views/ListBudgetItemView";

export default class SimpleBudgetHelperPlugin extends Plugin {
	settings: SimpleBudgetHelperSettings;
	private _categories: string[] = [];

	async onload() {
		await this.loadSettings();

		try {
			await this.app.vault.createFolder(this.settings.rootFolder);
		} catch (error) {
			const folder = this.app.vault.getFolderByPath(
				this.settings.rootFolder
			);
			if (!folder) return;
			const budget = new Budget([]);
			for (const file of folder.children) {
				if (file instanceof TFile) {
					const fileContent = await this.app.vault.cachedRead(file);
					const budgetItem = BudgetItem.fromRawMarkdown(fileContent);
					budget.addItem(budgetItem);
				}
			}
			this._categories = budget.categories;
		}

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		// );

		this.addCommand({
			id: "display-create-budget-item-modal",
			name: "Create budget item",
			callback: () => {
				new CreateBudgetItemModalRoot(
					this.app,
					[...this._categories, "-- create new --"].sort(),
					async (item) => {
						await this.app.vault.create(
							`${this.settings.rootFolder}/${item.name}.md`,
							item.toMarkdown()
						);
					}
				).open();
			},
		});

		this.registerView(
			views.LIST_BUDGET_ITEMS.type,
			(leaf) => new ListBudgetItemView(leaf, this.settings.rootFolder)
		);
		this.registerView(
			views.LIST_BUDGET_ITEMS_REACT.type,
			(leaf) =>
				new RightSidebarReactViewRoot(leaf, this.settings.rootFolder)
		);

		this.addRibbonIcon(
			views.LIST_BUDGET_ITEMS.icon,
			views.LIST_BUDGET_ITEMS.title,
			async () => {
				const leafs = this.app.workspace.getLeavesOfType(
					views.LIST_BUDGET_ITEMS.type
				);
				let leaf: WorkspaceLeaf | undefined;
				if (leafs.length === 0) {
					leaf =
						this.app.workspace.getRightLeaf(false) ??
						this.app.workspace.getLeaf();
					await leaf.setViewState({
						type: views.LIST_BUDGET_ITEMS.type,
					});
				} else {
					leaf = leafs.first();
				}
				if (!leaf || !(leaf.view instanceof ListBudgetItemView)) return;

				await this.app.workspace.revealLeaf(leaf);
				leaf.trigger("refresh");
				this.app.workspace.trigger("simple-budget-helper:refresh");
			}
		);

		this.addRibbonIcon(
			views.LIST_BUDGET_ITEMS_REACT.icon,
			views.LIST_BUDGET_ITEMS_REACT.title,
			async () => {
				const leafs = this.app.workspace.getLeavesOfType(
					views.LIST_BUDGET_ITEMS_REACT.type
				);
				let leaf: WorkspaceLeaf | undefined;
				if (leafs.length === 0) {
					leaf =
						this.app.workspace.getRightLeaf(false) ??
						this.app.workspace.getLeaf();
					await leaf.setViewState({
						type: views.LIST_BUDGET_ITEMS_REACT.type,
					});
				} else {
					leaf = leafs.first();
				}
				if (!leaf || !(leaf.view instanceof RightSidebarReactViewRoot))
					return;

				await this.app.workspace.revealLeaf(leaf);
				leaf.trigger("refresh");
				this.app.workspace.trigger(
					`${views.LIST_BUDGET_ITEMS_REACT.type}:refresh`
				);
			}
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
