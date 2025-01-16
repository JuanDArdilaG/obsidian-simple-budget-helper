import { App, Plugin, TFile } from "obsidian";
import { views } from "./config";
import {
	DEFAULT_SETTINGS,
	SettingTab,
	SimpleBudgetHelperSettings,
} from "./SettingTab";
import { RightSidebarReactViewRoot } from "./views/RightSidebarReactView/RightSidebarReactViewRoot";
import { Commands } from "commands";
import { LeftMenuItems } from "ribbonIcon";
import { Budget } from "budget/Budget/Budget";
import { BudgetItemMDFormatter } from "budget/BudgetItem/BudgetItemMDFormatter";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";

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

		const budget = await this._getBudget(
			this.app,
			this.settings.rootFolder
		);
		const categories = [
			...budget.getCategories(),
			"-- create new --",
		].sort();

		const statusBarItem = this.addStatusBarItem();

		this.registerView(
			views.LIST_BUDGET_ITEMS_REACT.type,
			(leaf) =>
				new RightSidebarReactViewRoot(
					leaf,
					this.app,
					this.settings,
					categories,
					this._getBudget,
					(item, operation) =>
						this._updateItemInFile(item, operation),
					(text) => statusBarItem.setText(text)
				)
		);

		this.addSettingTab(new SettingTab(this.app, this));
		Commands.CreateBudgetItemModal(
			this,
			categories,
			async () => {
				const budget = await this._getBudget(
					this.app,
					this.settings.rootFolder
				);
				const newID = budget.getNextID();
				return newID;
			},
			(item, operation) => this._updateItemInFile(item, operation)
		);
		LeftMenuItems.RightSidebarPanel(this);
	}

	private async _updateItemInFile(
		item: BudgetItem,
		operation: "add" | "modify" | "remove"
	) {
		console.log({ item, operation });
		if (operation === "add") {
			if (item.isRecurrent) {
				await this.app.vault.create(
					`${this.settings.rootFolder}/${item.filePath}`,
					new BudgetItemMDFormatter(item).toMarkdown()
				);
				return;
			}
			const simpleBudget = await Budget.loadSimpleTransactions(
				(
					await this._getBudget(this.app, this.settings.rootFolder)
				).onlyRecurrent().items.length,
				this.app.vault,
				this.settings.rootFolder
			);

			simpleBudget.addItems(item);

			await simpleBudget.saveSimpleTransactions(
				this.app.vault,
				this.settings.rootFolder
			);
		} else if (operation === "remove") {
			if (item.isRecurrent) {
				const file = this.app.vault.getAbstractFileByPath(
					`${this.settings.rootFolder}/${item.filePath}`
				);
				if (!file || !(file instanceof TFile)) return;
				await this.app.vault.modify(
					file,
					new BudgetItemMDFormatter(item).toMarkdown()
				);
				return;
			}
			const simpleBudget = await Budget.loadSimpleTransactions(
				(
					await this._getBudget(this.app, this.settings.rootFolder)
				).onlyRecurrent().items.length,
				this.app.vault,
				this.settings.rootFolder
			);
			simpleBudget.removeItemByID(item.id);
			await simpleBudget.saveSimpleTransactions(
				this.app.vault,
				this.settings.rootFolder
			);
		} else {
			console.log({ item, isRecurrent: item.isRecurrent });
			if (item.isRecurrent) {
				const file = this.app.vault.getAbstractFileByPath(
					`${this.settings.rootFolder}/${item.filePath}`
				);
				if (!file || !(file instanceof TFile)) return;
				await this.app.vault.modify(
					file,
					new BudgetItemMDFormatter(item).toMarkdown()
				);

				return;
			}
			const simpleBudget = await Budget.loadSimpleTransactions(
				(
					await this._getBudget(this.app, this.settings.rootFolder)
				).onlyRecurrent().items.length,
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

	private async _getBudget(app: App, rootFolder: string): Promise<Budget> {
		const { vault } = app;
		const getBudgetItemsByPath = async (
			path: string,
			budget: Budget
		): Promise<Budget> => {
			const folder = vault.getFolderByPath(path);
			if (!folder) return budget;
			let id = 0;
			for (const file of folder.children) {
				if (file instanceof TFile) {
					const fileContent = await vault.cachedRead(file);
					budget.addItems(
						BudgetItemMDFormatter.fromRawMarkdown(
							id,
							file.path,
							fileContent
						)
					);
					id++;
				}
			}

			return budget;
		};
		let budget = new Budget([]);
		budget = await getBudgetItemsByPath(`${rootFolder}/Recurrent`, budget);
		const simpleBudget = await Budget.loadSimpleTransactions(
			budget.items.length,
			vault,
			rootFolder
		);
		budget.addItems(...simpleBudget.items);

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
