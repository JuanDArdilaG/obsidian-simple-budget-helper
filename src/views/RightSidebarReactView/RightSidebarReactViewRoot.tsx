import { StrictMode } from "react";
import { App, ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { RightSidebarReactView } from "./RightSidebarReactView";
import { views } from "config";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { SimpleBudgetHelperSettings } from "SettingTab";
import { BudgetItemMDFormatter } from "budget/BudgetItem/BudgetItemMDFormatter";

export class RightSidebarReactViewRoot extends ItemView {
	root: Root | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private _app: App,
		private _settings: SimpleBudgetHelperSettings,
		private _categories: string[],
		private _getBudget: (app: App, rootFolder: string) => Promise<Budget>,
		private _updateItemInFile: (
			item: BudgetItem,
			operation: "add" | "modify" | "remove"
		) => Promise<void>,
		private _statusBarAddText: (val: string | DocumentFragment) => void
	) {
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
		const budget = await this._getBudget(
			this._app,
			this._settings.rootFolder
		);
		this.root?.render(
			<StrictMode>
				<RightSidebarReactView
					budget={budget}
					onRecord={(item) => this._updateFileOnRecord(item)}
					updateItemFile={this._updateItemInFile}
					refresh={async () => await this.refresh()}
					app={this.app}
					settings={this._settings}
					categories={this._categories}
					statusBarAddText={(text) => this._statusBarAddText(text)}
				/>
			</StrictMode>
		);
	}

	private async _updateFileOnRecord(newItem: BudgetItem) {
		const { vault } = this.app;
		const file = vault.getFileByPath(
			`${this._settings.rootFolder}/${newItem.filePath}`
		);
		if (!file) return;

		await vault.modify(
			file,
			new BudgetItemMDFormatter(newItem).toMarkdown()
		);

		this.refresh();
	}

	async onClose() {
		this.root?.unmount();
	}
}
