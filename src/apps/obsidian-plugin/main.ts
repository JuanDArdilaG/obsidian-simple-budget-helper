import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, SimpleBudgetHelperSettings } from "./SettingTab";
import { buildContainer } from "contexts/Shared/infrastructure/di/container";
import { CreateSimpleItemUseCase } from "contexts/Items/application/create-simple-item.usecase";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { ItemOperation } from "contexts/Items/domain/item-operation.valueobject";
import { ItemName } from "contexts/Items/domain/item-name.valueobject";
import { ItemPrice } from "contexts/Items/domain/item-price.valueobject";
import { ItemCategory } from "contexts/Items/domain/item-category.valueobject";
import { ItemSubcategory } from "contexts/Items/domain/item-subcategory.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { GetAllUniqueItemsByNameUseCase } from "contexts/Items/application/get-all-unique-items-by-name.usecase";
import { Logger } from "../../contexts/Shared/infrastructure/logger";
import { LeftMenuItems, SettingTab, views } from "apps/obsidian-plugin";
import { RightSidebarReactViewRoot } from "apps/obsidian-plugin/view";
import { Item, RecordSimpleItemUseCase, SimpleItem } from "contexts";

export default class SimpleBudgetHelperPlugin extends Plugin {
	settings: SimpleBudgetHelperSettings;

	async onload() {
		await initStoragePersistence();
		const storageQuota = await showEstimatedQuota();
		Logger.debug("storage quota", { storageQuota });

		const container = buildContainer();
		const createSimpleItemUseCase = container.resolve(
			"createSimpleItemUseCase"
		) as CreateSimpleItemUseCase;
		const recordSimpleItemUseCase = container.resolve(
			"recordSimpleItemUseCase"
		) as RecordSimpleItemUseCase;

		const item = SimpleItem.create(
			new ItemName("name"),
			new ItemPrice(100),
			ItemOperation.income(),
			new ItemCategory("category"),
			new ItemSubcategory("subCategory"),
			AccountID.generate()
		);

		await createSimpleItemUseCase.execute(item);
		await recordSimpleItemUseCase.execute(item);

		await this.loadSettings();

		const statusBarItem = this.addStatusBarItem();
		this.registerView(
			views.LIST_BUDGET_ITEMS_REACT.type,
			(leaf) =>
				new RightSidebarReactViewRoot(
					leaf,
					this,
					(text) => statusBarItem.setText(text),
					container
				)
		);

		this.addSettingTab(new SettingTab(this.app, this));
		LeftMenuItems.RightSidebarPanel(this);
	}

	// async _getBudget(
	// 	app: App,
	// 	rootFolder: string
	// ): Promise<Budget<BudgetItem>> {
	// 	const { vault } = app;
	// 	const getBudgetItemsByPath = async (
	// 		path: string,
	// 		budget: Budget<BudgetItem>
	// 	): Promise<Budget<BudgetItem>> => {
	// 		const folder = vault.getFolderByPath(path);
	// 		if (!folder) return budget;
	// 		for (const file of folder.children) {
	// 			if (file instanceof TFile) {
	// 				const fileContent = await vault.cachedRead(file);
	// 				const item = BudgetItemRecurrentMDFormatter.fromRawMarkdown(
	// 					file.path,
	// 					fileContent
	// 				);
	// 				budget.addItems(item);
	// 			}
	// 		}

	// 		return budget;
	// 	};
	// 	let budget = new Budget<BudgetItem>([]);
	// 	budget = await getBudgetItemsByPath(`${rootFolder}/Recurrent`, budget);
	// 	const simpleBudget = await Budget.loadSimpleTransactions(
	// 		vault,
	// 		rootFolder
	// 	);
	// 	budget.addItems(...simpleBudget.items);

	// 	console.log({ budget });

	// 	return budget;
	// }

	onunload() {
		persist();
	}

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

async function persist() {
	return navigator.storage && navigator.storage.persist
		? navigator.storage.persist()
		: undefined;
}

async function showEstimatedQuota(): Promise<
	{ quota?: number; usage?: number; percentage?: number } | undefined
> {
	const estimation =
		navigator.storage && navigator.storage.estimate
			? await navigator.storage.estimate()
			: undefined;
	if (!estimation) return undefined;
	return {
		...estimation,
		percentage: estimation.quota
			? ((estimation.usage ?? 0) / estimation.quota) * 100
			: 0,
	};
}

async function tryPersistWithoutPromptingUser() {
	if (!navigator.storage || !navigator.storage.persisted) return "never";
	let persisted = await navigator.storage.persisted();
	if (persisted) return "persisted";
	if (!navigator.permissions || !navigator.permissions.query) return "prompt";
	const permission = await navigator.permissions.query({
		name: "persistent-storage",
	});
	if (permission.state === "granted") {
		persisted = await navigator.storage.persist();
		if (persisted) return "persisted";
		throw new Error("failed to persist");
	}
	if (permission.state === "prompt") return "prompt";
	return "never";
}

async function initStoragePersistence() {
	const persist = await tryPersistWithoutPromptingUser();
	console.log({ persist });
}
