import Dexie from "dexie";
import { App, normalizePath, Plugin, PluginManifest } from "obsidian";
import { exportDB } from "dexie-export-import";
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

	async exportDBBackup() {
		const folder = normalizePath(`${this.settings.rootFolder}/db`);
		const path = normalizePath(`${this.settings.rootFolder}/db/db.backup`);
		const writeBackup = async () => {
			const blob = await exportDB(this.db);
			this.logger.debugB("writing backup", { folder, path }).log();
			await this.app.vault.adapter.writeBinary(
				path,
				await blob.arrayBuffer()
			);
		};
		try {
			await writeBackup();
		} catch (error) {
			if (error.code === "ENOENT") {
				this.logger.debugB("creating backup directory").log();
				await this.app.vault.adapter.mkdir(folder);
				await writeBackup();
			}
		}
	}

	async onload() {
		await this.loadSettings();
		const container = buildContainer();
		// await this.migrateFromMarkdown(container);
		this.db = (container.resolve("_db") as DexieDB).db;
		// await this.exportDBBackup();

		await initStoragePersistence();
		const storageQuota = await showEstimatedQuota();
		this.logger.debug("storage quota", { storageQuota });

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
			this.settings.rootFolder,
			container.resolve("getAllAccountsUseCase"),
			container.resolve("getAllCategoriesUseCase"),
			container.resolve("getAllSubCategoriesUseCase"),
			container.resolve("createAccountUseCase"),
			container.resolve("createCategoryUseCase"),
			container.resolve("createSubCategoryUseCase"),
			container.resolve("recordTransactionUseCase"),
			container.resolve("recordSimpleItemUseCase"),
			container.resolve("createRecurrentItemUseCase")
		);
		const { items, transactions } = await migrator.migrate();
		this.logger.debug("transactions migrated", {
			migration: {
				items: items.map((i) => i.toPrimitives()),
				transactions: transactions.map((t) => t.toPrimitives()),
			},
		});
	}

	async onunload() {
		this.logger.debug("onunload");
		persist();
	}

	async loadSettings() {
		const data = Object.assign(
			{},
			{ ...DEFAULT_SETTINGS },
			await this.loadData()
		);
		this.logger.debug("loaded settings", { data });
		this.settings = data;
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
	{ quota?: number; usage?: number; percentage?: string } | undefined
> {
	const estimation =
		navigator.storage && navigator.storage.estimate
			? await navigator.storage.estimate()
			: undefined;
	if (!estimation) return undefined;
	return {
		...estimation,
		percentage:
			String(
				estimation.quota
					? (
							((estimation.usage ?? 0) / estimation.quota) *
							100
					  ).toFixed(2)
					: 0
			) + "%",
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
