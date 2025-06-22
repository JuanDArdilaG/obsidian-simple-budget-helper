import { TextFileView, WorkspaceLeaf, TFile } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { JsonViewerView } from "./JsonViewerView";
import { views } from "apps/obsidian-plugin/config";
import SimpleBudgetHelperPlugin from "apps/obsidian-plugin/main";

export class JsonViewerViewRoot extends TextFileView {
	root: Root | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly _plugin: SimpleBudgetHelperPlugin
	) {
		super(leaf);
	}

	getViewType() {
		return views.JSON_VIEWER.type;
	}

	getDisplayText() {
		return views.JSON_VIEWER.title;
	}

	getIcon() {
		return views.JSON_VIEWER.icon;
	}

	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]);
		this.root?.render(
			<StrictMode>
				<JsonViewerView plugin={this._plugin} file={this.file} />
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}

	async onLoadFile(file: TFile) {
		// Re-render the component when a new file is loaded
		if (this.root) {
			this.root.render(
				<StrictMode>
					<JsonViewerView plugin={this._plugin} file={file} />
				</StrictMode>
			);
		}
	}

	async onunloadFile(file: TFile) {
		// Handle file unload if needed
	}

	getViewData(): string {
		// Return the current content if needed
		return "";
	}

	setViewData(data: string, clear: boolean): void {
		// Handle setting view data if needed
	}

	clear(): void {
		// Clear the view if needed
	}
}
