import { PluginSettingTab, App, Setting } from "obsidian";
import SimpleBudgetHelperPlugin from "./main";

export type SimpleBudgetHelperSettings = {
	rootFolder: string;
};

export const DEFAULT_SETTINGS: SimpleBudgetHelperSettings = {
	rootFolder: "Budget",
};

export class SettingTab extends PluginSettingTab {
	plugin: SimpleBudgetHelperPlugin;

	constructor(app: App, plugin: SimpleBudgetHelperPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Root folder")
			.setDesc("The path to the root folder to store budget items")
			.addText((text) =>
				text
					.setPlaceholder("Root Folder Path")
					.setValue(this.plugin.settings.rootFolder)
					.onChange(async (value) => {
						this.plugin.settings.rootFolder = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
