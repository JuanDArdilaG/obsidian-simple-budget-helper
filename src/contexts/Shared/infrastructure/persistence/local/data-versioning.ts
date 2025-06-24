import { Logger } from "../../logger";

export interface DataVersion {
	version: string;
	compatibleVersions: string[];
	migrationScript?: (data: unknown) => Promise<unknown>;
}

interface MigrationData {
	version: string;
	timestamp: string;
	data: Record<string, unknown>;
}

interface TransactionData {
	id: string;
	account?: string;
	toAccount?: string;
	amount?: number;
	fromSplits?: Array<{ accountId: string; amount: number }>;
	toSplits?: Array<{ accountId: string; amount: number }>;
	[key: string]: unknown;
}

interface ItemData {
	id: string;
	account?: string;
	toAccount?: string;
	amount?: number;
	fromSplits?: Array<{ accountId: string; amount: number }>;
	toSplits?: Array<{ accountId: string; amount: number }>;
	[key: string]: unknown;
}

export class DataVersioning {
	private logger: Logger = new Logger("DataVersioning");
	private currentVersion = "1.1.0";
	private versions: DataVersion[] = [
		{
			version: "1.0.0",
			compatibleVersions: ["1.0.0"],
			migrationScript: undefined,
		},
		{
			version: "1.1.0",
			compatibleVersions: ["1.0.0", "1.1.0"],
			migrationScript: this.migrateToPaymentSplits.bind(this),
		},
		// Add future versions here with migration scripts
	];

	getCurrentVersion(): string {
		return this.currentVersion;
	}

	isCompatible(version: string): boolean {
		const currentVersionData = this.versions.find(
			(v) => v.version === this.currentVersion
		);
		if (!currentVersionData) {
			return false;
		}

		return currentVersionData.compatibleVersions.includes(version);
	}

	async migrateData(data: unknown): Promise<unknown> {
		try {
			if (!data || typeof data !== "object") {
				throw new Error("Invalid data format for migration");
			}

			const dataObj = data as MigrationData;
			const sourceVersion = dataObj.version || "1.0.0";

			// If already at current version, no migration needed
			if (sourceVersion === this.currentVersion) {
				this.logger.debug(
					"Data is already at current version, no migration needed",
					{
						sourceVersion,
						currentVersion: this.currentVersion,
					}
				);
				return data;
			}

			this.logger.debug("Starting data migration", {
				from: sourceVersion,
				to: this.currentVersion,
			});

			let migratedData: unknown = data;
			const migrationPath = this.findMigrationPath(
				sourceVersion,
				this.currentVersion
			);

			for (const version of migrationPath) {
				const versionData = this.versions.find(
					(v) => v.version === version
				);
				if (versionData?.migrationScript) {
					this.logger.debug("Applying migration script", { version });
					migratedData = await versionData.migrationScript(
						migratedData
					);
				}
			}

			// Update version in migrated data
			if (migratedData && typeof migratedData === "object") {
				(migratedData as MigrationData).version = this.currentVersion;
			}

			this.logger.debug("Data migration completed successfully");
			return migratedData;
		} catch (error) {
			this.logger.error(error);
			throw error;
		}
	}

	/**
	 * Migration script to convert from single account/amount format to payment splits format
	 * This migrates data from version 1.0.0 to 1.1.0
	 */
	private async migrateToPaymentSplits(data: unknown): Promise<unknown> {
		this.logger.debug("Starting migration to payment splits format");

		if (!data || typeof data !== "object") {
			throw new Error("Invalid data format for payment splits migration");
		}

		const dataObj = data as MigrationData;

		// Ensure we have the data structure
		if (
			!dataObj.data ||
			typeof dataObj.data !== "object" ||
			dataObj.data === null
		) {
			throw new Error("Invalid data format for payment splits migration");
		}

		const migratedData = { ...dataObj };
		const dataContent = migratedData.data as Record<string, unknown>;

		// Migrate transactions if they exist
		if (
			dataContent.transactions &&
			Array.isArray(dataContent.transactions)
		) {
			this.logger.debug(
				`Migrating ${dataContent.transactions.length} transactions`
			);

			dataContent.transactions = dataContent.transactions.map(
				(transaction: unknown) => {
					return this.migrateTransaction(
						transaction as TransactionData
					);
				}
			);
		}

		// Migrate items if they exist
		if (dataContent.items && Array.isArray(dataContent.items)) {
			this.logger.debug(`Migrating ${dataContent.items.length} items`);

			dataContent.items = dataContent.items.map((item: unknown) => {
				return this.migrateItem(item as ItemData);
			});
		}

		this.logger.debug("Payment splits migration completed");
		return migratedData;
	}

	/**
	 * Migrate a single transaction from old format to new payment splits format
	 */
	private migrateTransaction(transaction: TransactionData): TransactionData {
		if (!transaction || typeof transaction !== "object") {
			return transaction;
		}

		const migratedTransaction = { ...transaction };

		// Check if this transaction needs migration (has old format fields)
		const hasOldFormat =
			transaction.account || transaction.toAccount || transaction.amount;
		const hasNewFormat = transaction.fromSplits || transaction.toSplits;

		// If already in new format, skip migration
		if (hasNewFormat && !hasOldFormat) {
			return migratedTransaction;
		}

		// Convert old format to new format
		if (hasOldFormat) {
			this.logger.debug("Migrating transaction", { id: transaction.id });

			// Initialize splits arrays
			migratedTransaction.fromSplits = [];
			migratedTransaction.toSplits = [];

			// Convert account/amount to fromSplits
			if (transaction.account && transaction.amount !== undefined) {
				migratedTransaction.fromSplits.push({
					accountId: transaction.account,
					amount: transaction.amount,
				});
			}

			// Convert toAccount/amount to toSplits
			if (transaction.toAccount && transaction.amount !== undefined) {
				migratedTransaction.toSplits.push({
					accountId: transaction.toAccount,
					amount: transaction.amount,
				});
			}

			// Remove old fields
			delete migratedTransaction.account;
			delete migratedTransaction.toAccount;
			delete migratedTransaction.amount;
		}

		return migratedTransaction;
	}

	/**
	 * Migrate a single item from old format to new payment splits format
	 */
	private migrateItem(item: ItemData): ItemData {
		if (!item || typeof item !== "object") {
			return item;
		}

		const migratedItem = { ...item };

		// Check if this item needs migration (has old format fields)
		const hasOldFormat = item.account || item.toAccount || item.amount;
		const hasNewFormat = item.fromSplits || item.toSplits;

		// If already in new format, skip migration
		if (hasNewFormat && !hasOldFormat) {
			return migratedItem;
		}

		// Convert old format to new format
		if (hasOldFormat) {
			this.logger.debug("Migrating item", { id: item.id });

			// Initialize splits arrays
			migratedItem.fromSplits = [];
			migratedItem.toSplits = [];

			// Convert account/amount to fromSplits
			if (item.account && item.amount !== undefined) {
				migratedItem.fromSplits.push({
					accountId: item.account,
					amount: item.amount,
				});
			}

			// Convert toAccount/amount to toSplits
			if (item.toAccount && item.amount !== undefined) {
				migratedItem.toSplits.push({
					accountId: item.toAccount,
					amount: item.amount,
				});
			}

			// Remove old fields
			delete migratedItem.account;
			delete migratedItem.toAccount;
			delete migratedItem.amount;
		}

		return migratedItem;
	}

	private findMigrationPath(
		fromVersion: string,
		toVersion: string
	): string[] {
		const path: string[] = [];
		const fromIndex = this.versions.findIndex(
			(v) => v.version === fromVersion
		);
		const toIndex = this.versions.findIndex((v) => v.version === toVersion);

		if (fromIndex === -1 || toIndex === -1) {
			throw new Error(
				`Version not found: from ${fromVersion} to ${toVersion}`
			);
		}

		// Simple linear migration path (assumes versions are ordered)
		if (fromIndex < toIndex) {
			for (let i = fromIndex + 1; i <= toIndex; i++) {
				path.push(this.versions[i].version);
			}
		} else if (fromIndex > toIndex) {
			// Downgrade not supported in this simple implementation
			throw new Error(
				`Downgrade not supported: from ${fromVersion} to ${toVersion}`
			);
		}

		return path;
	}

	validateDataStructure(data: unknown): boolean {
		try {
			if (!data || typeof data !== "object") {
				return false;
			}

			const dataObj = data as MigrationData;

			// Check required top-level properties
			if (!dataObj.version || !dataObj.timestamp || !dataObj.data) {
				return false;
			}

			// Validate version format
			if (typeof dataObj.version !== "string") {
				return false;
			}

			// Validate timestamp format
			if (typeof dataObj.timestamp !== "string") {
				return false;
			}

			// Validate data structure
			if (typeof dataObj.data !== "object" || dataObj.data === null) {
				return false;
			}

			return true;
		} catch (error) {
			this.logger.error(error);
			return false;
		}
	}

	getVersionInfo(version: string): DataVersion | undefined {
		return this.versions.find((v) => v.version === version);
	}

	getAllVersions(): DataVersion[] {
		return [...this.versions];
	}

	// Helper method to add new versions (for future use)
	addVersion(version: DataVersion): void {
		const existingIndex = this.versions.findIndex(
			(v) => v.version === version.version
		);
		if (existingIndex !== -1) {
			this.versions[existingIndex] = version;
		} else {
			this.versions.push(version);
		}

		// Sort versions (assuming semantic versioning)
		this.versions.sort((a, b) => {
			const aParts = a.version.split(".").map(Number);
			const bParts = b.version.split(".").map(Number);

			for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
				const aPart = aParts[i] || 0;
				const bPart = bParts[i] || 0;
				if (aPart !== bPart) {
					return aPart - bPart;
				}
			}
			return 0;
		});
	}
}
