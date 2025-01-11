import { PluginSettingTab, App, Setting } from "obsidian";
import SimpleBudgetHelperPlugin from "./main";

export interface SimpleBudgetHelperSettings {
	rootFolder: string;
	initialBudget: number;
	openInNewTab: boolean;
}

export const DEFAULT_SETTINGS: SimpleBudgetHelperSettings = {
	rootFolder: "Budget",
	initialBudget: 0,
	openInNewTab: false,
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

		new Setting(containerEl)
			.setName("Initial budget")
			.setDesc("The initial budget amount")
			.addText((text) =>
				text
					.setPlaceholder("Initial Budget")
					.setValue(this.plugin.settings.initialBudget.toString())
					.onChange(async (value) => {
						const val = parseInt(value);
						this.plugin.settings.initialBudget = !isNaN(val)
							? val
							: 0;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Open files in new tab")
			.setDesc("When clicking on a budget item, open it in a new tab")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.openInNewTab)
					.onChange(async (value) => {
						this.plugin.settings.openInNewTab = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
