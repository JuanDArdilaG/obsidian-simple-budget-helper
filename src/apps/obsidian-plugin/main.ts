import { UUIDValueObject } from "@juandardilag/value-objects";
import {
	JsonViewerViewRoot,
	RightSidebarReactViewRoot,
} from "apps/obsidian-plugin/views";
import { AwilixContainer } from "awilix";
import { buildContainer } from "contexts/Shared/infrastructure/di/container";
import { LocalDB } from "contexts/Shared/infrastructure/persistence/local/local.db";
import { App, Plugin, PluginManifest } from "obsidian";
import { AccountsLocalRepository } from "../../contexts/Accounts/infrastructure/persistence/local/accounts-local.repository";
import { Currency } from "../../contexts/Currencies/domain/currency.vo";
import { Logger } from "../../contexts/Shared/infrastructure/logger";
import { views } from "./config";
import { DEFAULT_SETTINGS, SimpleBudgetHelperSettings } from "./PluginSettings";
import { LeftMenuItems } from "./ribbonIcon";
import { SettingTab } from "./SettingTab";

export default class SimpleBudgetHelperPlugin extends Plugin {
	settings: SimpleBudgetHelperSettings;
	db: LocalDB;
	logger: Logger;
	container: AwilixContainer;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.logger = new Logger("main");
		this.db = new LocalDB(app);
		this.container = buildContainer(this.db);
	}

	async exportDBBackup(backupName: string = "db.backup") {
		try {
			const backupInfo = await this.db.createBackup(backupName);
			this.logger.debug("Database backup created", { backupInfo });
			return backupInfo;
		} catch (error) {
			this.logger.error("exportDBBackup error", error);
			throw error;
		}
	}

	async importDBBackup(backupName: string = "db.backup") {
		try {
			await this.db.restoreFromBackup(backupName);
			this.logger.debug("Database backup restored successfully");
		} catch (error) {
			this.logger.error("importDBBackup error", error);
			throw error;
		}
	}

	async migrate() {
		const accountsRepository = new AccountsLocalRepository(this.db);
		const accounts = await accountsRepository.findAll();
		this.logger.debug("migrate accounts", { accounts });

		accounts.forEach(async (account) => {
			this.logger.debug("Account", { account: account.toPrimitives() });
			account.currency = new Currency(this.settings.defaultCurrency);
			this.logger.debug("Updated Account", {
				account: account.toPrimitives(),
			});
			await accountsRepository.persist(account);
		});
	}

	async onload() {
		this.logger.debug("Plugin onload started");

		await this.loadSettings();
		if (!this.settings.dbId) {
			this.settings.dbId = UUIDValueObject.random().value;
			await this.saveSettings();
		}
		Logger.setDebugMode(this.settings.debugMode);

		await initStoragePersistence();
		const storageQuota = await showEstimatedQuota();
		this.logger.debug("storage quota", { storageQuota });

		// Initialize local database
		await this.db.init(this.settings.dbId);

		// await this.migrate();

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

		this.logger.debug("Starting periodic backups");
		this.registerInterval(this.db.startPeriodicBackups());
		this.logger.debug("Plugin onload completed");

		// Register JSON viewer view
		this.registerView(
			views.JSON_VIEWER.type,
			(leaf) => new JsonViewerViewRoot(leaf, this)
		);

		// Register JSON file extension handler
		this.registerExtensions(["json"], "json-viewer-view");
	}

	onunload(): void {
		this.logger.debug("Plugin onunload started");

		// Stop all intervals
		this.db.stopIntervals();

		// Sync data to local files before unloading
		this.db.sync().catch((error) => {
			this.logger.error("sync error", error);
		});
		persist();

		this.logger.debug("Plugin onunload completed");
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

	async loadCurrencies() {}
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
