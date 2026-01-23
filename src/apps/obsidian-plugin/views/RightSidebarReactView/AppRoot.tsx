import { views } from "apps/obsidian-plugin/config";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { AppView } from "./App";

export class AppRoot extends ItemView {
	root: Root | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly _plugin: SimpleBudgetHelperPlugin,
		private readonly _statusBarAddText: (
			val: string | DocumentFragment,
		) => void,
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
		this.root?.render(
			<StrictMode>
				<AppView plugin={this._plugin} />
			</StrictMode>,
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
