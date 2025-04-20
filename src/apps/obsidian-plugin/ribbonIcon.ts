import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";
import { views } from "apps/obsidian-plugin/config";
import { WorkspaceLeaf } from "obsidian";
import { RightSidebarReactViewRoot } from "./views";

export class LeftMenuItems {
	static RightSidebarPanel(plugin: SimpleBudgetHelperPlugin) {
		plugin.addRibbonIcon(
			views.LIST_BUDGET_ITEMS_REACT.icon,
			views.LIST_BUDGET_ITEMS_REACT.title,
			async () => {
				const leafs = plugin.app.workspace.getLeavesOfType(
					views.LIST_BUDGET_ITEMS_REACT.type
				);
				let leaf: WorkspaceLeaf | undefined;
				if (leafs.length === 0) {
					leaf = plugin.app.workspace.getLeaf(false);
					await leaf.setViewState({
						type: views.LIST_BUDGET_ITEMS_REACT.type,
					});
				} else {
					leaf = leafs.first();
				}
				if (!leaf || !(leaf.view instanceof RightSidebarReactViewRoot))
					return;

				await plugin.app.workspace.revealLeaf(leaf);
				leaf.trigger("refresh");
				plugin.app.workspace.trigger(
					`${views.LIST_BUDGET_ITEMS_REACT.type}:refresh`
				);
			}
		);
	}
}
