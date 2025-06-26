import { Account } from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import { Brand } from "contexts/Items/domain/brand.entity";
import { ProductItem } from "contexts/Items/domain/product-item.entity";
import { Provider } from "contexts/Items/domain/provider.entity";
import { ScheduledItem } from "contexts/Items/domain/scheduled-item.entity";
import { Store } from "contexts/Items/domain/store.entity";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { SubCategory } from "contexts/Subcategories/domain";
import { Transaction } from "contexts/Transactions/domain";
import Dexie from "dexie";
import { App } from "obsidian";
import { Logger } from "../../logger";
import { DB } from "../db";
import { BackupManager } from "./backup-manager";
import { ConflictResolver } from "./conflict-resolver";
import { DataVersioning } from "./data-versioning";
import { LocalFileManager } from "./local-file-manager";

// Static flags to prevent multiple intervals across all instances
let globalAutoSyncInterval: number | undefined;
let globalPeriodicBackupInterval: number | undefined;

export class LocalDB extends DB {
	db: Dexie;
	logger: Logger = new Logger("LocalDB");
	public fileManager: LocalFileManager;
	private conflictResolver: ConflictResolver;
	public backupManager: BackupManager;
	private dataVersioning: DataVersioning;
	private dbId: string = "";

	constructor(app: App) {
		super();
		this.fileManager = new LocalFileManager(app);
		this.conflictResolver = new ConflictResolver();
		this.backupManager = new BackupManager(app);
		this.dataVersioning = new DataVersioning();
	}

	async init(dbId: string) {
		try {
			this.logger.debug("initializing local dexie");
			this.db = new Dexie(`BudgetHelper-${dbId}`);
			this.dbId = dbId;

			this.logger.debug("initializing tables");
			this.#initializeTables();

			this.logger.debug("opening db");
			await this.db.open();

			// Initialize file manager with database ID
			await this.fileManager.init(dbId);

			// Load data from local files if they exist
			await this.loadFromLocalFiles();

			// Create initial backup
			await this.backupManager.createBackup(this.db, this.dbId);

			this.logger.debug("local dexie initialized successfully");
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	// Start periodic auto-sync every 30 seconds
	public startAutoSync(): number {
		// Clear existing global interval if any
		if (globalAutoSyncInterval) {
			window.clearInterval(globalAutoSyncInterval);
		}

		globalAutoSyncInterval = window.setInterval(async () => {
			try {
				await this.saveToLocalFiles();
				this.logger.debug("Periodic auto-sync completed");
			} catch (error) {
				this.logger.error(error);
			}
		}, 30000); // 30 seconds

		this.logger.debug("Auto-sync interval started");
		return globalAutoSyncInterval;
	}

	// Start periodic backup creation every 10 minutes
	public startPeriodicBackups(): number {
		// Clear existing global interval if any
		if (globalPeriodicBackupInterval) {
			window.clearInterval(globalPeriodicBackupInterval);
		}

		globalPeriodicBackupInterval = window.setInterval(async () => {
			try {
				this.logger.debug("Periodic backup interval triggered");
				await this.createBackup();
				this.logger.debug("Periodic backup created");
			} catch (error) {
				this.logger.error(error);
			}
		}, 600000); // 10 minutes

		this.logger.debug("Periodic backup interval started");
		return globalPeriodicBackupInterval;
	}

	// Stop all intervals
	public stopIntervals(): void {
		if (globalAutoSyncInterval) {
			window.clearInterval(globalAutoSyncInterval);
			globalAutoSyncInterval = undefined;
			this.logger.debug("Auto-sync interval stopped");
		}
		if (globalPeriodicBackupInterval) {
			window.clearInterval(globalPeriodicBackupInterval);
			globalPeriodicBackupInterval = undefined;
			this.logger.debug("Periodic backup interval stopped");
		}
	}

	async loadFromLocalFiles() {
		try {
			const hasLocalData = await this.fileManager.hasLocalData();
			if (hasLocalData) {
				this.logger.debug("Loading data from local files");
				const localData = await this.fileManager.loadData();

				// Check for conflicts and resolve them
				const conflicts = await this.conflictResolver.detectConflicts(
					this.db,
					localData
				);
				if (conflicts.length > 0) {
					this.logger.debug("Conflicts detected, resolving...", {
						conflicts,
					});
					const resolvedData =
						await this.conflictResolver.resolveConflicts(
							conflicts,
							localData
						);
					await this.fileManager.saveData(resolvedData);
				}

				// Import data into IndexedDB
				await this.importData(localData);
			}
		} catch (error) {
			this.logger.error(error);
			// Continue with empty database if loading fails
		}
	}

	async saveToLocalFiles() {
		try {
			const data = await this.exportData();
			await this.fileManager.saveData(data);
			this.logger.debug("Data saved to local files");
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async exportData() {
		const data: Record<string, unknown[]> = {};

		for (const tableName of Object.values(Config)) {
			data[tableName] = await this.db.table(tableName).toArray();
		}

		return {
			version: this.dataVersioning.getCurrentVersion(),
			timestamp: new Date().toISOString(),
			data,
		};
	}

	async importData(data: {
		data: Record<string, unknown[]>;
		version: string;
	}) {
		try {
			// Validate data structure
			if (!data.data || !data.version) {
				throw new Error("Invalid data format");
			}

			// Check if migration is needed (when version is different from current)
			const currentVersion = this.dataVersioning.getCurrentVersion();
			if (data.version !== currentVersion) {
				this.logger.debug(
					"Data version differs from current version, attempting migration",
					{
						dataVersion: data.version,
						currentVersion: currentVersion,
					}
				);
				data = (await this.dataVersioning.migrateData(
					data
				)) as typeof data;
			}

			// Clear existing data and import new data
			for (const tableName of Object.values(Config)) {
				await this.db.table(tableName).clear();
				if (data.data[tableName]) {
					await this.db
						.table(tableName)
						.bulkAdd(data.data[tableName]);
				}
			}

			this.logger.debug("Data imported successfully");
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async createBackup(backupName?: string) {
		try {
			this.logger.debug("createBackup called", { backupName });

			// Check if there's any data in the database before creating backup
			const hasData = await this.hasData();
			if (!hasData) {
				this.logger.debug(
					"Skipping backup creation - no data in database"
				);
				return null;
			}

			this.logger.debug("Creating backup", { backupName, hasData });
			const backupInfo = await this.backupManager.createBackup(
				this.db,
				this.dbId,
				backupName
			);
			await this.backupManager.cleanupOldBackups();
			return backupInfo;
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	// Check if there's any data in the database
	private async hasData(): Promise<boolean> {
		try {
			for (const tableName of Object.values(Config)) {
				const count = await this.db.table(tableName).count();
				if (count > 0) {
					return true;
				}
			}
			return false;
		} catch (error) {
			this.logger.error(error);
			return false;
		}
	}

	async restoreFromBackup(backupName: string) {
		return await this.backupManager.restoreBackup(this.db, backupName);
	}

	async getBackupList() {
		return await this.backupManager.getBackupList();
	}

	async sync() {
		try {
			// Save current IndexedDB state to local files
			await this.saveToLocalFiles();

			this.logger.debug("Sync completed successfully");
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	#initializeTables() {
		this.db.version(1).stores({
			[Config.accountsTableName]: Object.keys(
				Account.emptyPrimitives()
			).join(", "),
			[Config.categoriesTableName]: Object.keys(
				Category.emptyPrimitives()
			).join(", "),
			[Config.scheduledItemsTableName]: Object.keys(
				ScheduledItem.emptyPrimitives()
			).join(", "),
			[Config.subCategoriesTableName]: Object.keys(
				SubCategory.emptyPrimitives()
			).join(", "),
			[Config.transactionsTableName]: Object.keys(
				Transaction.emptyPrimitives()
			).join(", "),
		});

		this.db
			.version(2)
			.stores({
				[Config.accountsTableName]: Object.keys(
					Account.emptyPrimitives()
				).join(", "),
				[Config.categoriesTableName]: Object.keys(
					Category.emptyPrimitives()
				).join(", "),
				[Config.itemsTableName]: Object.keys(
					ProductItem.emptyPrimitives()
				).join(", "),
				[Config.scheduledItemsTableName]: Object.keys(
					ScheduledItem.emptyPrimitives()
				).join(", "),
				[Config.brandsTableName]: Object.keys(
					Brand.emptyPrimitives()
				).join(", "),
				[Config.storesTableName]: Object.keys(
					Store.emptyPrimitives()
				).join(", "),
				[Config.providersTableName]: Object.keys(
					Provider.emptyPrimitives()
				).join(", "),
				[Config.subCategoriesTableName]: Object.keys(
					SubCategory.emptyPrimitives()
				).join(", "),
				[Config.transactionsTableName]: Object.keys(
					Transaction.emptyPrimitives()
				).join(", "),
			})
			.upgrade(async (tx) => {
				// Migrate data from version 1 to version 2
				await tx
					.table(Config.scheduledItemsTableName)
					.toArray()
					.then((items) => {
						// The items are already in the correct table, just need to ensure they're properly formatted
						return Promise.resolve();
					});
				return tx;
			});
	}
}
