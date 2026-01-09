import { Account } from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { SubCategory } from "contexts/Subcategories/domain";
import { Transaction } from "contexts/Transactions/domain";
import Dexie from "dexie";
import { App } from "obsidian";
import {
	RecurrenceModification,
	ScheduledTransaction,
} from "../../../../ScheduledTransactions/domain";
import { ScheduledItem } from "../../../../ScheduledTransactions/domain/old/scheduled-item.entity";
import { Store } from "../../../../Stores/domain";
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
			this.logger.error("Error initializing local dexie", error);
			throw error;
		}
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
				this.logger.error("Error during periodic backup", error);
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
				let dataToImport = localData;

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
					dataToImport = resolvedData;
				}

				// Import data into IndexedDB (prioritizing local file data)
				await this.importData(dataToImport);
			}
		} catch (error) {
			this.logger.error("Error loading data from local files", error);
			// Continue with empty database if loading fails
		}
	}

	async saveToLocalFiles() {
		try {
			const data = await this.exportData();
			await this.fileManager.saveData(data);
			this.logger.debug("Data saved to local files");
		} catch (error) {
			this.logger.error("Error saving data to local files", error);
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
			this.logger.error("Error importing data", error);
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
			this.logger.error("Error creating backup", error);
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
			this.logger.error("Error checking if database has data", error);
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
			this.logger.error("Error during sync", error);
			throw error;
		}
	}

	#initializeTables() {
		this.db.version(3).stores({
			[Config.accountsTableName]: Object.keys(
				Account.emptyPrimitives()
			).join(", "),
			[Config.categoriesTableName]: Object.keys(
				Category.emptyPrimitives()
			).join(", "),
			[Config.scheduledItemsTableOldName]: Object.keys(
				ScheduledItem.emptyPrimitives()
			).join(", "),
			[Config.scheduledTransactionsTableName]: Object.keys(
				ScheduledTransaction.emptyPrimitives()
			).join(", "),
			[Config.scheduledTransactionsModificationsTableName]: Object.keys(
				RecurrenceModification.emptyPrimitives()
			).join(", "),
			[Config.storesTableName]: Object.keys(Store.emptyPrimitives()).join(
				", "
			),
			[Config.subCategoriesTableName]: Object.keys(
				SubCategory.emptyPrimitives()
			).join(", "),
			[Config.transactionsTableName]: Object.keys(
				Transaction.emptyPrimitives()
			).join(", "),
		});
	}
}
