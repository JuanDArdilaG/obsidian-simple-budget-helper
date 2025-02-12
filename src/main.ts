import { App, Plugin, TFile } from "obsidian";
import { views } from "./config";
import {
	DEFAULT_SETTINGS,
	SettingTab,
	SimpleBudgetHelperSettings,
} from "./SettingTab";
import { RightSidebarReactViewRoot } from "./view/views/RightSidebarReactView/RightSidebarReactViewRoot";
import { LeftMenuItems } from "ribbonIcon";
import { Budget } from "budget/Budget/Budget";
import { BudgetItemRecurrentMDFormatter } from "budget/BudgetItem/BudgetItemMDFormatter";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { Logger } from "utils/logger";

export default class SimpleBudgetHelperPlugin extends Plugin {
	settings: SimpleBudgetHelperSettings;

	async initFoldersAndFiles() {
		const safeCreateFolder = async (path: string) => {
			try {
				await this.app.vault.createFolder(path);
			} catch (error) {
				console.log({ error, path });
			}
		};
		const safeCreateFile = async (path: string, content: string) => {
			try {
				await this.app.vault.create(path, content);
			} catch (error) {
				console.log({ error, path, content });
			}
		};

		await safeCreateFolder(this.settings.rootFolder);
		await safeCreateFolder(`${this.settings.rootFolder}/Recurrent`);
		await safeCreateFile(`${this.settings.rootFolder}/Simple.md`, "");
		return this.app.vault.getFileByPath(
			`${this.settings.rootFolder}/Simple.md`
		);
	}

	async onload() {
		await this.loadSettings();
		const simpleTransactionsFile = await this.initFoldersAndFiles();
		if (!simpleTransactionsFile) throw new Error("Failed to create file.");

		const statusBarItem = this.addStatusBarItem();
		this.registerView(
			views.LIST_BUDGET_ITEMS_REACT.type,
			(leaf) =>
				new RightSidebarReactViewRoot(leaf, this, (text) =>
					statusBarItem.setText(text)
				)
		);

		this.addSettingTab(new SettingTab(this.app, this));
		LeftMenuItems.RightSidebarPanel(this);
	}

	async _updateItemInFile(
		item: BudgetItem,
		operation: "add" | "modify" | "remove"
	) {
		console.log({ item, operation });
		if (operation === "add") {
			if (item instanceof BudgetItemRecurrent) {
				await this.app.vault.create(
					`${this.settings.rootFolder}/${item.name}.md`,
					new BudgetItemRecurrentMDFormatter(item).toMarkdown()
				);
				return;
			} else if (item instanceof BudgetItemSimple) {
				const simpleBudget = await Budget.loadSimpleTransactions(
					this.app.vault,
					this.settings.rootFolder
				);

				simpleBudget.addItems(item);

				await simpleBudget.saveSimpleTransactions(
					this.app.vault,
					this.settings.rootFolder
				);
			}
		} else if (operation === "remove") {
			if (item instanceof BudgetItemRecurrent) {
				const file = this.app.vault.getAbstractFileByPath(
					item.filePath
				);
				if (!file || !(file instanceof TFile)) return;
				await this.app.vault.modify(
					file,
					new BudgetItemRecurrentMDFormatter(item).toMarkdown()
				);
				return;
			}
			const simpleBudget = await Budget.loadSimpleTransactions(
				this.app.vault,
				this.settings.rootFolder
			);
			simpleBudget.removeItemByID(item.id);
			await simpleBudget.saveSimpleTransactions(
				this.app.vault,
				this.settings.rootFolder
			);
		} else {
			console.log({
				item,
				isRecurrent: item instanceof BudgetItemRecurrent,
			});
			if (item instanceof BudgetItemRecurrent) {
				const file = this.app.vault.getAbstractFileByPath(
					item.filePath
				);
				Logger.debug("modifying file", {
					path: item.filePath,
					file,
					isFile: file instanceof TFile,
				});
				if (!file || !(file instanceof TFile)) return;
				await this.app.vault.modify(
					file,
					new BudgetItemRecurrentMDFormatter(item).toMarkdown()
				);

				return;
			} else if (item instanceof BudgetItemSimple) {
				const simpleBudget = await Budget.loadSimpleTransactions(
					this.app.vault,
					this.settings.rootFolder
				);
				simpleBudget.updateItemByID(item.id, item);
				await simpleBudget.saveSimpleTransactions(
					this.app.vault,
					this.settings.rootFolder
				);
			}
		}
	}

	async _getBudget(
		app: App,
		rootFolder: string
	): Promise<Budget<BudgetItem>> {
		const { vault } = app;
		const getBudgetItemsByPath = async (
			path: string,
			budget: Budget<BudgetItem>
		): Promise<Budget<BudgetItem>> => {
			const folder = vault.getFolderByPath(path);
			if (!folder) return budget;
			for (const file of folder.children) {
				if (file instanceof TFile) {
					const fileContent = await vault.cachedRead(file);
					const item = BudgetItemRecurrentMDFormatter.fromRawMarkdown(
						file.path,
						fileContent
					);
					budget.addItems(item);
				}
			}

			return budget;
		};
		let budget = new Budget<BudgetItem>([]);
		budget = await getBudgetItemsByPath(`${rootFolder}/Recurrent`, budget);
		const simpleBudget = await Budget.loadSimpleTransactions(
			vault,
			rootFolder
		);
		budget.addItems(...simpleBudget.items);

		console.log({ budget });

		return budget;
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
