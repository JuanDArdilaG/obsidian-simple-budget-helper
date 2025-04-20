import Dexie from "dexie";
import { exportDB, importDB } from "dexie-export-import";
import { App, normalizePath, Plugin, PluginManifest } from "obsidian";
import { SettingTab } from "./SettingTab";
import { buildContainer } from "contexts/Shared/infrastructure/di/container";
import { Logger } from "../../contexts/Shared/infrastructure/logger";
import { RightSidebarReactViewRoot } from "apps/obsidian-plugin/views";
import { DexieDB } from "contexts/Shared/infrastructure/persistence/dexie/dexie.db";
import { views } from "./config";
import { LeftMenuItems } from "./ribbonIcon";
import { SimpleBudgetHelperSettings, DEFAULT_SETTINGS } from "./PluginSettings";

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
				return;
			}
			throw error;
		}
	}

	async importDBBackup() {
		const path = normalizePath(`${this.settings.rootFolder}/db/db.backup`);
		const buffer = await this.app.vault.adapter.readBinary(path);
		this.db = await importDB(new Blob([buffer]));
	}

	async onload() {
		await this.loadSettings();
		Logger.setDebugMode(this.settings.debugMode);
		const container = buildContainer();
		this.db = (container.resolve("_db") as DexieDB).db;

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

	onunload(): void {
		this.logger.debug("onunload");
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
