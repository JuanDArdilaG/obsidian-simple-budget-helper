import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { RightSidebarReactView } from "./RightSidebarReactView";
import { views } from "apps/obsidian-plugin/config";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { AwilixContainer } from "awilix";

export class RightSidebarReactViewRoot extends ItemView {
	root: Root | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private _plugin: SimpleBudgetHelperPlugin,
		private _statusBarAddText: (val: string | DocumentFragment) => void,
		private _container: AwilixContainer<any>
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
		this.root?.render(
			<StrictMode>
				<RightSidebarReactView
					container={this._container}
					plugin={this._plugin}
					refresh={async () => await this.refresh()}
					statusBarAddText={(text) => this._statusBarAddText(text)}
				/>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
