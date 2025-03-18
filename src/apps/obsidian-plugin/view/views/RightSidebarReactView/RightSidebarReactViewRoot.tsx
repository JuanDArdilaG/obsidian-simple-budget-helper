import { StrictMode } from "react";
import { App, ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { RightSidebarReactView } from "./RightSidebarReactView";
import { views } from "apps/obsidian-plugin/config";
import { Budget } from "budget/Budget/Budget";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { SimpleBudgetHelperSettings } from "apps/obsidian-plugin/SettingTab";
import { BudgetItemRecurrentMDFormatter } from "budget/BudgetItem/BudgetItemMDFormatter";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";

export class RightSidebarReactViewRoot extends ItemView {
	root: Root | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private _plugin: SimpleBudgetHelperPlugin,
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
		const budget = await this._plugin._getBudget(
			this._plugin.app,
			this._plugin.settings.rootFolder
		);
		console.log({ refreshed: budget });
		this.root?.render(
			<StrictMode>
				<RightSidebarReactView
					budget={budget}
					plugin={this._plugin}
					onRecord={(item) => this._updateFileOnRecord(item)}
					refresh={async () => await this.refresh()}
					statusBarAddText={(text) => this._statusBarAddText(text)}
				/>
			</StrictMode>
		);
	}

	private async _updateFileOnRecord(newItem: BudgetItem) {
		const { vault } = this.app;
		const file = vault.getFileByPath(
			newItem.filePath ??
				`${this._plugin.settings.rootFolder}/${newItem.name}.md`
		);
		if (!file) return;

		await vault.modify(
			file,
			new BudgetItemRecurrentMDFormatter(
				newItem as BudgetItemRecurrent
			).toMarkdown()
		);

		this.refresh();
	}

	async onClose() {
		this.root?.unmount();
	}
}
