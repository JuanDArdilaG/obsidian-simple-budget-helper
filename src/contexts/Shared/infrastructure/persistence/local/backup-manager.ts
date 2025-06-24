import Dexie from "dexie";
import { exportDB, importInto } from "dexie-export-import";
import { App, normalizePath } from "obsidian";
import { Logger } from "../../logger";

export interface BackupInfo {
	name: string;
	path: string;
	size: number;
	createdAt: Date;
	description?: string;
}

export class BackupManager {
	private app: App;
	private logger: Logger = new Logger("BackupManager");
	private backupFolder: string = "";

	constructor(app: App) {
		this.app = app;
		this.backupFolder = normalizePath("BudgetHelper/backups");
	}

	async init(): Promise<void> {
		try {
			const folderExists = await this.app.vault.adapter.exists(
				this.backupFolder
			);
			if (!folderExists) {
				await this.app.vault.adapter.mkdir(this.backupFolder);
				this.logger.debug("Created backup folder", {
					folder: this.backupFolder,
				});
			}
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async createBackup(
		db: Dexie,
		dbId: string,
		backupName?: string
	): Promise<BackupInfo> {
		try {
			await this.init();

			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const name = backupName || `backup-${dbId}-${timestamp}`;
			const path = normalizePath(`${this.backupFolder}/${name}.json`);

			// Export database to blob
			const blob = await exportDB(db);

			// Convert blob to base64 string using Buffer for proper binary handling
			const arrayBuffer = await blob.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);
			const base64Data = Buffer.from(uint8Array).toString("base64");

			// Create backup metadata
			const backupData = {
				metadata: {
					name,
					dbId,
					createdAt: new Date().toISOString(),
					version: "1.0.0",
					description: backupName
						? `Manual backup: ${backupName}`
						: "Automatic backup",
				},
				data: base64Data,
			};

			// Save backup to file
			const jsonContent = JSON.stringify(backupData, null, 2);
			await this.app.vault.adapter.write(path, jsonContent);

			const backupInfo: BackupInfo = {
				name,
				path,
				size: jsonContent.length,
				createdAt: new Date(),
				description: backupData.metadata.description,
			};

			this.logger.debug("Backup created successfully", { backupInfo });
			return backupInfo;
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async restoreBackup(db: Dexie, backupName: string): Promise<void> {
		try {
			const path = normalizePath(
				`${this.backupFolder}/${backupName}.json`
			);

			// Check if backup exists
			const exists = await this.app.vault.adapter.exists(path);
			if (!exists) {
				throw new Error(`Backup not found: ${backupName}`);
			}

			// Read backup file
			const fileContent = await this.app.vault.adapter.read(path);
			const backupData = JSON.parse(fileContent);

			// Validate backup structure
			if (!backupData.metadata || !backupData.data) {
				throw new Error("Invalid backup format");
			}

			let blob: Blob;

			// Handle both old array format and new base64 format
			if (Array.isArray(backupData.data)) {
				// Old format: array of numbers
				const uint8Array = new Uint8Array(backupData.data);
				blob = new Blob([uint8Array]);
			} else if (typeof backupData.data === "string") {
				// New format: base64 string using Buffer for proper binary handling
				const uint8Array = Buffer.from(backupData.data, "base64");
				blob = new Blob([uint8Array]);
			} else {
				throw new Error("Unsupported backup data format");
			}

			// Import backup into database
			await importInto(db, blob, {
				clearTablesBeforeImport: true,
				acceptNameDiff: true,
				acceptVersionDiff: true,
			});

			this.logger.debug("Backup restored successfully", {
				backupName,
				version: backupData.metadata.version,
				createdAt: backupData.metadata.createdAt,
			});
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async getBackupList(): Promise<BackupInfo[]> {
		try {
			await this.init();

			const files = await this.app.vault.adapter.list(this.backupFolder);
			const backups: BackupInfo[] = [];

			for (const file of files.files) {
				if (file.endsWith(".json")) {
					try {
						const fileContent = await this.app.vault.adapter.read(
							file
						);
						const backupData = JSON.parse(fileContent);

						if (backupData.metadata) {
							const stat = await this.app.vault.adapter.stat(
								file
							);
							backups.push({
								name: backupData.metadata.name,
								path: file,
								size: stat?.size ?? 0,
								createdAt: new Date(
									backupData.metadata.createdAt
								),
								description: backupData.metadata.description,
							});
						}
					} catch (error) {
						this.logger.error(error);
					}
				}
			}

			// Sort by creation date (newest first)
			backups.sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
			);

			return backups;
		} catch (error) {
			this.logger.error(error);
			return [];
		}
	}

	async deleteBackup(backupName: string): Promise<void> {
		try {
			const path = normalizePath(
				`${this.backupFolder}/${backupName}.json`
			);

			const exists = await this.app.vault.adapter.exists(path);
			if (!exists) {
				throw new Error(`Backup not found: ${backupName}`);
			}

			await this.app.vault.adapter.remove(path);
			this.logger.debug("Backup deleted successfully", { backupName });
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async cleanupOldBackups(maxBackups: number = 10): Promise<void> {
		try {
			const backups = await this.getBackupList();

			if (backups.length > maxBackups) {
				const backupsToDelete = backups.slice(maxBackups);

				for (const backup of backupsToDelete) {
					await this.deleteBackup(backup.name);
				}

				this.logger.debug("Old backups cleaned up", {
					deleted: backupsToDelete.length,
					remaining: maxBackups,
				});
			}
		} catch (error) {
			this.logger.error(error);
		}
	}

	async validateBackup(backupName: string): Promise<boolean> {
		try {
			const path = normalizePath(
				`${this.backupFolder}/${backupName}.json`
			);

			const exists = await this.app.vault.adapter.exists(path);
			if (!exists) {
				return false;
			}

			const fileContent = await this.app.vault.adapter.read(path);
			const backupData = JSON.parse(fileContent);

			// Basic validation for both old and new formats
			const hasValidMetadata = !!backupData.metadata;
			const hasValidData = !!(
				(
					backupData.data &&
					(Array.isArray(backupData.data) || // Old format: array
						(typeof backupData.data === "string" &&
							backupData.data.length > 0))
				) // New format: base64 string
			);

			return hasValidMetadata && hasValidData;
		} catch (error) {
			this.logger.error(error);
			return false;
		}
	}
}
