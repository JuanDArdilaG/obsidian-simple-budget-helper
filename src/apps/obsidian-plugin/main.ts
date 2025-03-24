import { App, Plugin, PluginManifest } from "obsidian";
import Dexie from "dexie";
import { exportDB, importDB } from "dexie-export-import";
import { DEFAULT_SETTINGS, SimpleBudgetHelperSettings } from "./SettingTab";
import { buildContainer } from "contexts/Shared/infrastructure/di/container";
import { Logger } from "../../contexts/Shared/infrastructure/logger";
import { LeftMenuItems, SettingTab, views } from "apps/obsidian-plugin";
import { RightSidebarReactViewRoot } from "apps/obsidian-plugin/views";
import { DexieDB } from "contexts";
import { MDMigration } from "contexts/Shared/infrastructure/migration/md.migration";
import { AwilixContainer } from "awilix";

export default class SimpleBudgetHelperPlugin extends Plugin {
	settings: SimpleBudgetHelperSettings;
	db: Dexie;
	logger: Logger;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.logger = new Logger("main");
	}

	async onload() {
		// await this.restoreDB();
		await this.loadSettings();
		await initStoragePersistence();
		const storageQuota = await showEstimatedQuota();
		this.logger.debug("storage quota", { storageQuota });

		const container = buildContainer();
		await this.migrateFromMarkdown(container);
		this.db = (container.resolve("_db") as DexieDB).db;

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

	async migrateFromMarkdown(container: AwilixContainer) {
		const migrator = new MDMigration(
			this.app.vault,
			container.resolve("getAllAccountsUseCase"),
			container.resolve("getAllCategoriesUseCase"),
			container.resolve("getAllSubCategoriesUseCase"),
			container.resolve("createAccountUseCase"),
			container.resolve("createCategoryUseCase"),
			container.resolve("createSubCategoryUseCase"),
			container.resolve("recordTransactionUseCase")
		);
		this.logger.debug("transactions migrated", {
			transactions: (
				await migrator.migrate(this.settings.rootFolder)
			).map((t) => t.toPrimitives()),
		});
	}

	async onunload() {
		this.logger.debug("onunload");
		persist();
		// await this.saveDB();
	}

	async restoreDB() {
		this.loadDB();
	}

	async loadSettings() {
		const data = Object.assign(
			{},
			{ settings: DEFAULT_SETTINGS },
			await this.loadData()
		);
		this.logger.debug("loaded data", { data });
		this.settings = data.settings;
	}

	async loadDB(): Promise<Dexie | undefined> {
		const data = Object.assign(
			{},
			{ db: undefined },
			await this.loadData()
		);
		this.logger.debug("loaded data", { data });
		if (!data.db) return;
		const db = importDB(new Blob([data.db], { type: "text/plain" }));
		this.logger.debug("db loaded", { db });
		return db;
	}

	async saveSettings() {
		const data = Object.assign(
			{},
			{ settings: DEFAULT_SETTINGS },
			await this.loadData()
		);
		await this.saveData({
			...data,
			settings: this.settings,
		});
	}

	async saveDB() {
		const data = Object.assign(
			{},
			{ settings: DEFAULT_SETTINGS },
			await this.loadData()
		);
		const blob = await exportDB(this.db);
		const text = await blob.text();
		this.logger.debug("db blob", { blob, text });
		await this.saveData({
			...data,
			db: text,
		});
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
