import { exportDB, importInto } from "dexie-export-import";
import { App, normalizePath, Plugin, PluginManifest } from "obsidian";
import { SettingTab } from "./SettingTab";
import { buildContainer } from "contexts/Shared/infrastructure/di/container";
import { Logger } from "../../contexts/Shared/infrastructure/logger";
import { RightSidebarReactViewRoot } from "apps/obsidian-plugin/views";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import { views } from "./config";
import { LeftMenuItems } from "./ribbonIcon";
import { SimpleBudgetHelperSettings, DEFAULT_SETTINGS } from "./PluginSettings";
import { AwilixContainer } from "awilix";
import { GetAllItemsUseCase } from "contexts/Items/application/get-all-items.usecase";
import { UpdateItemUseCase } from "contexts/Items/application/update-item.usecase";

export default class SimpleBudgetHelperPlugin extends Plugin {
	settings: SimpleBudgetHelperSettings;
	db: DexieDB;
	logger: Logger;
	container = buildContainer();

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.logger = new Logger("main");
		this.db = this.container.resolve("_db") as DexieDB;
	}

	async exportDBBackup(backupName: string = "db.backup") {
		const folder = normalizePath(`${this.settings.rootFolder}/db`);
		const path = normalizePath(
			`${this.settings.rootFolder}/db/${backupName}`
		);
		const writeBackup = async () => {
			const blob = await exportDB(this.db.db);
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
				return;
			}
			throw error;
		}
	}

	async importDBBackup(backupName: string = "db.backup") {
		// await this.db.db.delete();
		const path = normalizePath(
			`${this.settings.rootFolder}/db/${backupName}`
		);
		const buffer = await this.app.vault.adapter.readBinary(path);
		await importInto(this.db.db, new Blob([buffer]));
	}

	async migrateItems(container: AwilixContainer) {
		const { items } = await container
			.resolve<GetAllItemsUseCase>("getAllItemsUseCase")
			.execute();
		console.log({ items });
		const updateItemUseCase =
			container.resolve<UpdateItemUseCase>("updateItemUseCase");
		await Promise.all(
			items.map(async (item) => {
				item.recurrence.createRecurrences();
				console.log({ item });
				await updateItemUseCase.execute(item);
			})
		);
	}

	async onload() {
		await this.loadSettings();
		Logger.setDebugMode(this.settings.debugMode);

		await initStoragePersistence();
		const storageQuota = await showEstimatedQuota();
		this.logger.debug("storage quota", { storageQuota });

		await this.importDBBackup("sync.backup");
		await this.db.init();

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

		this.registerInterval(
			window.setInterval(
				async () => await this.exportDBBackup("sync.backup"),
				2 * 60 * 1000
			)
		);
	}

	onunload(): void {
		this.logger.debug("onunload");
		this.exportDBBackup("sync.backup");
		persist();
	}

	async loadSettings() {
		const data = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
		this.logger.debug("loaded settings", { data });
		this.settings = data;
	}

	async saveSettings() {
		this.logger.debugB("saving settings", { data: this.settings }).log();
		await this.saveData(this.settings);
	}
}

async function persist() {
	return navigator.storage?.persist ? navigator.storage.persist() : undefined;
}

async function showEstimatedQuota(): Promise<
	{ quota?: number; usage?: number; percentage?: string } | undefined
> {
	const estimation = navigator.storage?.estimate
		? await navigator.storage?.estimate()
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
	if (!navigator.storage?.persisted) return "never";
	let persisted = await navigator.storage.persisted();
	if (persisted) return "persisted";
	if (!navigator.permissions?.query) return "prompt";
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
