import { StrictMode } from "react";
import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { RightSidebarReactView } from "./RightSidebarReactView";
import { views } from "src/constants";
import { Budget } from "src/budget/Budget";
import { BudgetItem } from "src/budget/BudgetItem";

export class RightSidebarReactViewRoot extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf, private _rootFolder: string) {
		super(leaf);
	}

	getViewType() {
		return views.LIST_BUDGET_ITEMS_REACT.type;
	}

	getDisplayText() {
		return views.LIST_BUDGET_ITEMS_REACT.title;
	}

	getIcon() {
		return views.LIST_BUDGET_ITEMS_REACT.icon;
	}

	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]);
		this.refresh();
	}

	async refresh() {
		this.root?.render(
			<StrictMode>
				<RightSidebarReactView
					rootFolder={this._rootFolder}
					budget={await this._getBudgetItems()}
					onRecord={(item) => this._updateFileOnRecord(item)}
					refresh={() => this.refresh()}
				/>
			</StrictMode>
		);
	}

	private async _updateFileOnRecord(newItem: BudgetItem) {
		const { vault } = this.app;
		const file = vault.getFileByPath(
			`${this._rootFolder}/${newItem.name}.md`
		);
		if (!file) return;

		await vault.modify(file, newItem.toMarkdown());

		this.refresh();
	}

	private async _getBudgetItems(): Promise<Budget> {
		const { vault } = this.app;
		const folder = vault.getFolderByPath(this._rootFolder);
		if (!folder) return new Budget([]);
		const budget = new Budget([]);
		for (const file of folder.children) {
			if (file instanceof TFile) {
				const fileContent = await vault.cachedRead(file);
				budget.addItem(BudgetItem.fromRawMarkdown(fileContent));
			}
		}

		return budget;
	}

	async onClose() {
		this.root?.unmount();
	}
}
