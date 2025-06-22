import { App, normalizePath } from "obsidian";
import { Logger } from "../../logger";
import { Config } from "contexts/Shared/infrastructure/config/config";

export interface LocalData {
	version: string;
	timestamp: string;
	data: Record<string, unknown[]>;
}

export class LocalFileManager {
	private app: App;
	private logger: Logger = new Logger("LocalFileManager");
	private dataFolder: string = "";
	private dataFile: string = "";

	constructor(app: App) {
		this.app = app;
	}

	async init(dbId: string) {
		this.dataFolder = normalizePath(`BudgetHelper/${dbId}`);
		this.dataFile = normalizePath(`${this.dataFolder}/data.json`);

		// Ensure the data folder exists
		await this.ensureDataFolder();
	}

	private async ensureDataFolder(): Promise<void> {
		try {
			const folderExists = await this.app.vault.adapter.exists(
				this.dataFolder
			);
			if (!folderExists) {
				await this.app.vault.adapter.mkdir(this.dataFolder);
				this.logger.debug("Created data folder", {
					folder: this.dataFolder,
				});
			}
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async hasLocalData(): Promise<boolean> {
		try {
			return await this.app.vault.adapter.exists(this.dataFile);
		} catch (error) {
			this.logger.error(error);
			return false;
		}
	}

	async loadData(): Promise<LocalData> {
		try {
			const fileContent = await this.app.vault.adapter.read(
				this.dataFile
			);
			const data = JSON.parse(fileContent);

			// Validate data structure
			if (!this.isValidDataStructure(data)) {
				throw new Error("Invalid data structure in local file");
			}

			this.logger.debug("Loaded data from local file", {
				file: this.dataFile,
				version: data.version,
				timestamp: data.timestamp,
			});

			return data;
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async saveData(data: LocalData): Promise<void> {
		try {
			// Validate data before saving
			if (!this.isValidDataStructure(data)) {
				throw new Error("Invalid data structure");
			}

			// Update timestamp
			data.timestamp = new Date().toISOString();

			const jsonContent = JSON.stringify(data, null, 2);
			await this.app.vault.adapter.write(this.dataFile, jsonContent);

			this.logger.debug("Saved data to local file", {
				file: this.dataFile,
				version: data.version,
				timestamp: data.timestamp,
			});
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async deleteData(): Promise<void> {
		try {
			if (await this.hasLocalData()) {
				await this.app.vault.adapter.remove(this.dataFile);
				this.logger.debug("Deleted local data file", {
					file: this.dataFile,
				});
			}
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	async getDataInfo(): Promise<{
		exists: boolean;
		size?: number;
		lastModified?: Date;
	}> {
		try {
			const exists = await this.hasLocalData();
			if (!exists) {
				return { exists: false };
			}

			const stat = await this.app.vault.adapter.stat(this.dataFile);
			return {
				exists: !!stat,
				size: stat?.size,
				lastModified: stat?.mtime ? new Date(stat.mtime) : undefined,
			};
		} catch (error) {
			this.logger.error(error);
			return { exists: false };
		}
	}

	private isValidDataStructure(data: unknown): data is LocalData {
		if (!data || typeof data !== "object") {
			return false;
		}

		const localData = data as LocalData;

		if (typeof localData.version !== "string") {
			return false;
		}

		if (typeof localData.timestamp !== "string") {
			return false;
		}

		if (!localData.data || typeof localData.data !== "object") {
			return false;
		}

		// Check if all expected tables are present
		const expectedTables = Object.values(Config);
		for (const tableName of expectedTables) {
			if (!(tableName in localData.data)) {
				return false;
			}
			if (!Array.isArray(localData.data[tableName])) {
				return false;
			}
		}

		return true;
	}
}
