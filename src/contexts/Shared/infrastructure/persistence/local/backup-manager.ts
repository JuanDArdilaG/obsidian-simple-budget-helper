import Dexie from "dexie";
import { exportDB, importInto } from "dexie-export-import";
import { Base64 } from "js-base64";
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
	private readonly app: App;
	private readonly logger: Logger = new Logger("BackupManager");
	private readonly backupFolder: string = "";

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
			this.logger.error("init error", error);
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

			const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
			const name = backupName || `backup-${dbId}-${timestamp}`;
			const path = normalizePath(`${this.backupFolder}/${name}.json`);

			// Export database to blob
			const blob = await exportDB(db);

			// Convert blob to base64 string using browser-compatible method
			const arrayBuffer = await blob.arrayBuffer();
			const uint8Array = new Uint8Array(arrayBuffer);

			// Use js-base64's built-in Uint8Array support
			const base64Data = Base64.fromUint8Array(uint8Array);

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
			this.logger.error("createBackup error", error);
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
				// New format: base64 string using browser-compatible method
				const decoded = Base64.toUint8Array(backupData.data);
				const uint8Array = new Uint8Array(decoded);
				blob = new Blob([uint8Array]);
			} else {
				throw new TypeError("Unsupported backup data format");
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
			this.logger.error("restoreBackup error", error);
			throw error;
		}
	}

	async getBackupList(): Promise<BackupInfo[]> {
		try {
			await this.init();

			const files = await this.app.vault.adapter.list(this.backupFolder);

			this.logger.debug("Found backup files", {
				count: files.files.length,
			});

			const filesContent = (
				await Promise.all(
					files.files
						.filter((file) => {
							const fileName = file.split("/").pop() || "";
							// Filter out macOS metadata files (._*) and only include .json files
							return (
								file.endsWith(".json") &&
								!fileName.startsWith("._")
							);
						})
						.map(async (file) => {
							try {
								const fileContent =
									await this.app.vault.adapter.read(file);
								this.logger.debug("Reading backup file", {
									file,
								});
								return {
									fileContent,
									file,
								};
							} catch (error) {
								this.logger.error(
									"Error reading backup file",
									error
								);
								return { fileContent: null, file: file };
							}
						})
				)
			)
				.filter(({ fileContent }) => fileContent !== null)
				.map(({ fileContent, file }) => {
					try {
						this.logger.debug("Parsing backup file", {
							file,
						});
						return {
							fileContent: JSON.parse(fileContent!),
							file,
						};
					} catch (error) {
						this.logger.error("Error parsing backup file", error);
						return null;
					}
				})
				.filter((item) => item !== null);

			const backups: BackupInfo[] = (
				await Promise.all(
					filesContent.map(({ file }) => {
						this.logger.debug("Getting file stats", { file });
						return this.app.vault.adapter.stat(file);
					})
				)
			).map((stat, index) => {
				this.logger.debug("Processing backup file", {
					file: filesContent[index].file,
				});
				return {
					name: filesContent[index].fileContent.metadata.name,
					path: filesContent[index].file,
					size: stat?.size ?? 0,
					createdAt: new Date(
						filesContent[index].fileContent.metadata.createdAt
					),
					description:
						filesContent[index].fileContent.metadata.description,
				};
			});

			// Sort by creation date (newest first)
			backups.sort(
				(a, b) => b.createdAt.getTime() - a.createdAt.getTime()
			);

			this.logger.debug("Sorted backup files by creation date", {
				count: backups.length,
			});

			return backups;
		} catch (error) {
			this.logger.error("getBackupList error", error);
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
			this.logger.error("deleteBackup error", error);
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
			this.logger.error("cleanupOldBackups error", error);
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
			this.logger.error("validateBackup error", error);
			return false;
		}
	}
}
