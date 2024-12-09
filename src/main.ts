import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	WorkspaceLeaf,
} from "obsidian";
import { LIST_BUDGET_ITEMS_VIEW, PLUGIN_INFO } from "./constants";
import { CreateBudgetItemModal } from "./CreateBudgetItemModal";
import { ListBudgetItemView } from "./ListBudgetItemView";

// Remember to rename these classes and interfaces!
interface SimpleBudgetHelperSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: SimpleBudgetHelperSettings = {
	mySetting: "default",
};

export default class SimpleBudgetHelperPlugin extends Plugin {
	settings: SimpleBudgetHelperSettings;

	async onload() {
		await this.loadSettings();

		try {
			await this.app.vault.createFolder(PLUGIN_INFO.rootFolder);
		} catch (error) {
			console.error(error);
		}

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			PLUGIN_INFO.name,
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);

		this.addCommand({
			id: "display-create-budget-item-modal",
			name: "Create budget item",
			callback: () => {
				new CreateBudgetItemModal(this.app, async (item) => {
					console.log(item);
					await this.app.vault.create(
						`${PLUGIN_INFO.rootFolder}/${item.name}.md`,
						item.toMarkdown()
					);
					this.app.workspace.trigger("simple-budget-helper:refresh");
				}).open();
			},
		});

		this.registerView(
			LIST_BUDGET_ITEMS_VIEW.type,
			(leaf) => new ListBudgetItemView(leaf)
		);

		this.addRibbonIcon("dice", "Activate view", async () => {
			const leafs = this.app.workspace.getLeavesOfType(
				LIST_BUDGET_ITEMS_VIEW.type
			);
			let leaf: WorkspaceLeaf | undefined;
			if (leafs.length === 0) {
				leaf =
					this.app.workspace.getRightLeaf(false) ??
					this.app.workspace.getLeaf();
				await leaf.setViewState({
					type: LIST_BUDGET_ITEMS_VIEW.type,
				});
			} else {
				leaf = leafs.first();
			}
			if (!leaf || !(leaf.view instanceof ListBudgetItemView)) return;

			await this.app.workspace.revealLeaf(leaf);
			leaf.trigger("refresh");
			this.app.workspace.trigger("simple-budget-helper:refresh");
		});
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

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: SimpleBudgetHelperPlugin;

	constructor(app: App, plugin: SimpleBudgetHelperPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
