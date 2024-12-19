import { StrictMode } from "react";
import { ItemView, TFile, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { RightSidebarReactView } from "./RightSidebarReactView";
import { views } from "src/constants";
import { Budget } from "src/Budget";
import { BudgetItem } from "src/BudgetItem";

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
		this.root.render(
			<StrictMode>
				<RightSidebarReactView
					rootFolder={this._rootFolder}
					budget={await this._getBudgetItems()}
				/>
			</StrictMode>
		);
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
