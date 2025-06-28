import { UUIDValueObject } from "@juandardilag/value-objects";
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
	private currentVersion = "1.2.3";
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
		{
			version: "1.2.0",
			compatibleVersions: ["1.0.0", "1.1.0", "1.2.0"],
			migrationScript: this.migrateToNewItemStructure.bind(this),
		},
		{
			version: "1.2.1",
			compatibleVersions: ["1.0.0", "1.1.0", "1.2.0", "1.2.1"],
			migrationScript: this.migrateToManyToManyRelationships.bind(this),
		},
		{
			version: "1.2.2",
			compatibleVersions: ["1.0.0", "1.1.0", "1.2.0", "1.2.1", "1.2.2"],
			migrationScript: this.migrateToArrayBasedRelationships.bind(this),
		},
		{
			version: "1.2.3",
			compatibleVersions: [
				"1.0.0",
				"1.1.0",
				"1.2.0",
				"1.2.1",
				"1.2.2",
				"1.2.3",
			],
			migrationScript:
				this.migrateToConsolidatedBrandsAndProviders.bind(this),
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

	/**
	 * Migration script to convert from old Item structure to new Item/ScheduledItem structure
	 * This migrates data from version 1.1.0 to 1.2.0
	 */
	private async migrateToNewItemStructure(data: unknown): Promise<unknown> {
		this.logger.debug("Starting migration to new item structure");

		if (!data || typeof data !== "object") {
			throw new Error(
				"Invalid data format for new item structure migration"
			);
		}

		const dataObj = data as MigrationData;

		// Ensure we have the data structure
		if (
			!dataObj.data ||
			typeof dataObj.data !== "object" ||
			dataObj.data === null
		) {
			throw new Error(
				"Invalid data format for new item structure migration"
			);
		}

		const migratedData = { ...dataObj };
		const dataContent = migratedData.data as Record<string, unknown>;

		// Initialize new tables
		dataContent.items = [];
		dataContent.brands = [];
		dataContent.stores = [];
		dataContent.providers = [];

		// Migrate old items to scheduled items and extract brands/stores
		if (
			dataContent.scheduledItems &&
			Array.isArray(dataContent.scheduledItems)
		) {
			this.logger.debug(
				`Migrating ${dataContent.scheduledItems.length} scheduled items`
			);

			const brandsMap = new Map<
				string,
				{ id: string; name: string; itemId: string; updatedAt: string }
			>();
			const storesMap = new Map<
				string,
				{ id: string; name: string; itemId: string; updatedAt: string }
			>();

			// Process each scheduled item to extract unique brands and stores
			dataContent.scheduledItems.forEach(
				(item: {
					id: string;
					brand?: string;
					store?: string;
					updatedAt?: string;
				}) => {
					// Extract brand if it exists
					if (item.brand && item.brand.trim() !== "") {
						if (!brandsMap.has(item.brand)) {
							const brandId = this.generateId();
							brandsMap.set(item.brand, {
								id: brandId,
								name: item.brand,
								itemId: item.id,
								updatedAt:
									item.updatedAt || new Date().toISOString(),
							});
						}
					}

					// Extract store if it exists
					if (item.store && item.store.trim() !== "") {
						if (!storesMap.has(item.store)) {
							const storeId = this.generateId();
							storesMap.set(item.store, {
								id: storeId,
								name: item.store,
								itemId: item.id,
								updatedAt:
									item.updatedAt || new Date().toISOString(),
							});
						}
					}
				}
			);

			// Add extracted brands to the brands table
			if (brandsMap.size > 0) {
				this.logger.debug(`Extracted ${brandsMap.size} unique brands`);
				dataContent.brands = Array.from(brandsMap.values());
			}

			// Add extracted stores to the stores table
			if (storesMap.size > 0) {
				this.logger.debug(`Extracted ${storesMap.size} unique stores`);
				dataContent.stores = Array.from(storesMap.values());
			}

			// The scheduled items are already in the correct format, no transformation needed
		}

		this.logger.debug("New item structure migration completed");
		return migratedData;
	}

	/**
	 * Migration script to convert from one-to-many to many-to-many relationships
	 * This migrates data from version 1.2.0 to 1.2.1
	 */
	private async migrateToManyToManyRelationships(
		data: unknown
	): Promise<unknown> {
		this.logger.debug("Starting migration to many-to-many relationships");

		if (!data || typeof data !== "object") {
			throw new Error(
				"Invalid data format for many-to-many relationships migration"
			);
		}

		const dataObj = data as MigrationData;

		// Ensure we have the data structure
		if (
			!dataObj.data ||
			typeof dataObj.data !== "object" ||
			dataObj.data === null
		) {
			throw new Error(
				"Invalid data format for many-to-many relationships migration"
			);
		}

		const migratedData = { ...dataObj };
		const dataContent = migratedData.data as Record<string, unknown>;

		// Migrate brands to remove itemId field
		if (dataContent.brands && Array.isArray(dataContent.brands)) {
			this.logger.debug(`Migrating ${dataContent.brands.length} brands`);

			dataContent.brands = dataContent.brands.map(
				(brand: Record<string, unknown>) => {
					const brandCopy = { ...brand };
					delete brandCopy.itemId;
					return brandCopy;
				}
			);
		}

		// Migrate stores to remove itemId field
		if (dataContent.stores && Array.isArray(dataContent.stores)) {
			this.logger.debug(`Migrating ${dataContent.stores.length} stores`);

			dataContent.stores = dataContent.stores.map(
				(store: Record<string, unknown>) => {
					const storeCopy = { ...store };
					delete storeCopy.itemId;
					return storeCopy;
				}
			);
		}

		// Migrate providers to remove itemId field (if they exist)
		if (dataContent.providers && Array.isArray(dataContent.providers)) {
			this.logger.debug(
				`Migrating ${dataContent.providers.length} providers`
			);

			dataContent.providers = dataContent.providers.map(
				(provider: Record<string, unknown>) => {
					const providerCopy = { ...provider };
					delete providerCopy.itemId;
					return providerCopy;
				}
			);
		}

		this.logger.debug("Many-to-many relationships migration completed");
		return migratedData;
	}

	/**
	 * Migration script to convert from single brand/store/provider values to arrays
	 * This migrates data from version 1.2.1 to 1.2.2
	 */
	private async migrateToArrayBasedRelationships(
		data: unknown
	): Promise<unknown> {
		this.logger.debug("Starting migration to array-based relationships");

		if (!data || typeof data !== "object") {
			throw new Error(
				"Invalid data format for array-based relationships migration"
			);
		}

		const dataObj = data as MigrationData;

		// Ensure we have the data structure
		if (
			!dataObj.data ||
			typeof dataObj.data !== "object" ||
			dataObj.data === null
		) {
			throw new Error(
				"Invalid data format for array-based relationships migration"
			);
		}

		const migratedData = { ...dataObj };
		const dataContent = migratedData.data as Record<string, unknown>;

		// Migrate items to use arrays for brands, stores, and providers
		if (dataContent.items && Array.isArray(dataContent.items)) {
			this.logger.debug(
				`Migrating ${dataContent.items.length} items to array-based relationships`
			);

			dataContent.items = dataContent.items.map(
				(item: Record<string, unknown>) => {
					const itemCopy = { ...item };

					// Convert single brand to array
					if (itemCopy.brand && typeof itemCopy.brand === "string") {
						itemCopy.brands = [itemCopy.brand];
						delete itemCopy.brand;
					} else if (!itemCopy.brands) {
						itemCopy.brands = [];
					}

					// Convert single store to array
					if (itemCopy.store && typeof itemCopy.store === "string") {
						itemCopy.stores = [itemCopy.store];
						delete itemCopy.store;
					} else if (!itemCopy.stores) {
						itemCopy.stores = [];
					}

					// Convert single provider to array
					if (
						itemCopy.provider &&
						typeof itemCopy.provider === "string"
					) {
						itemCopy.providers = [itemCopy.provider];
						delete itemCopy.provider;
					} else if (!itemCopy.providers) {
						itemCopy.providers = [];
					}

					return itemCopy;
				}
			);
		}

		this.logger.debug("Array-based relationships migration completed");
		return migratedData;
	}

	/**
	 * Migration script to consolidate duplicate brand and provider entities
	 * This migrates data from version 1.2.2 to 1.2.3
	 */
	private async migrateToConsolidatedBrandsAndProviders(
		data: unknown
	): Promise<unknown> {
		this.logger.debug(
			"Starting migration to consolidate duplicate brands and providers"
		);

		if (!data || typeof data !== "object") {
			throw new Error(
				"Invalid data format for brand/provider consolidation migration"
			);
		}

		const dataObj = data as MigrationData;

		// Ensure we have the data structure
		if (
			!dataObj.data ||
			typeof dataObj.data !== "object" ||
			dataObj.data === null
		) {
			throw new Error(
				"Invalid data format for brand/provider consolidation migration"
			);
		}

		const migratedData = { ...dataObj };
		const dataContent = migratedData.data as Record<string, unknown>;

		// Consolidate duplicate brands
		if (dataContent.brands && Array.isArray(dataContent.brands)) {
			this.logger.debug(
				`Consolidating ${dataContent.brands.length} brands`
			);

			const brandNameMap = new Map<string, string[]>(); // name -> array of IDs
			const brandIdMap = new Map<string, string>(); // old ID -> new ID to keep
			const brandsToKeep: Record<string, unknown>[] = [];

			// Group brands by name
			dataContent.brands.forEach((brand: Record<string, unknown>) => {
				const name = brand.name as string;
				const id = brand.id as string;

				if (!brandNameMap.has(name)) {
					brandNameMap.set(name, []);
				}
				brandNameMap.get(name)!.push(id);
			});

			// For each group of brands with the same name, keep the first one and map others to it
			brandNameMap.forEach((ids, name) => {
				if (ids.length > 1) {
					this.logger.debug(
						`Found ${ids.length} duplicate brands with name: ${name}`
					);

					// Keep the first brand, map others to it
					const brandToKeep = ids[0];
					brandsToKeep.push(
						(dataContent.brands as Record<string, unknown>[]).find(
							(b: Record<string, unknown>) => b.id === brandToKeep
						)!
					);

					// Map all other IDs to the one we're keeping
					ids.slice(1).forEach((id) => {
						brandIdMap.set(id, brandToKeep);
					});
				} else {
					// No duplicates, keep as is
					brandsToKeep.push(
						(dataContent.brands as Record<string, unknown>[]).find(
							(b: Record<string, unknown>) => b.id === ids[0]
						)!
					);
				}
			});

			// Update brands array to only include the ones we're keeping
			dataContent.brands = brandsToKeep;

			// Update items to use the consolidated brand IDs
			if (dataContent.items && Array.isArray(dataContent.items)) {
				this.logger.debug(
					`Updating ${dataContent.items.length} items with consolidated brand IDs`
				);

				dataContent.items = dataContent.items.map(
					(item: Record<string, unknown>) => {
						const itemCopy = { ...item };

						if (itemCopy.brands && Array.isArray(itemCopy.brands)) {
							itemCopy.brands = itemCopy.brands.map(
								(brandId: string) => {
									return brandIdMap.get(brandId) || brandId;
								}
							);
						}

						return itemCopy;
					}
				);
			}

			// Update transactions to use the consolidated brand IDs
			if (
				dataContent.transactions &&
				Array.isArray(dataContent.transactions)
			) {
				this.logger.debug(
					`Updating ${dataContent.transactions.length} transactions with consolidated brand IDs`
				);

				dataContent.transactions = dataContent.transactions.map(
					(transaction: Record<string, unknown>) => {
						const transactionCopy = { ...transaction };

						if (
							transactionCopy.brand &&
							typeof transactionCopy.brand === "string"
						) {
							const newBrandId = brandIdMap.get(
								transactionCopy.brand
							);
							if (newBrandId) {
								transactionCopy.brand = newBrandId;
							}
						}

						return transactionCopy;
					}
				);
			}
		}

		// Consolidate duplicate providers
		if (dataContent.providers && Array.isArray(dataContent.providers)) {
			this.logger.debug(
				`Consolidating ${dataContent.providers.length} providers`
			);

			const providerNameMap = new Map<string, string[]>(); // name -> array of IDs
			const providerIdMap = new Map<string, string>(); // old ID -> new ID to keep
			const providersToKeep: Record<string, unknown>[] = [];

			// Group providers by name
			dataContent.providers.forEach(
				(provider: Record<string, unknown>) => {
					const name = provider.name as string;
					const id = provider.id as string;

					if (!providerNameMap.has(name)) {
						providerNameMap.set(name, []);
					}
					providerNameMap.get(name)!.push(id);
				}
			);

			// For each group of providers with the same name, keep the first one and map others to it
			providerNameMap.forEach((ids, name) => {
				if (ids.length > 1) {
					this.logger.debug(
						`Found ${ids.length} duplicate providers with name: ${name}`
					);

					// Keep the first provider, map others to it
					const providerToKeep = ids[0];
					providersToKeep.push(
						(
							dataContent.providers as Record<string, unknown>[]
						).find(
							(p: Record<string, unknown>) =>
								p.id === providerToKeep
						)!
					);

					// Map all other IDs to the one we're keeping
					ids.slice(1).forEach((id) => {
						providerIdMap.set(id, providerToKeep);
					});
				} else {
					// No duplicates, keep as is
					providersToKeep.push(
						(
							dataContent.providers as Record<string, unknown>[]
						).find((p: Record<string, unknown>) => p.id === ids[0])!
					);
				}
			});

			// Update providers array to only include the ones we're keeping
			dataContent.providers = providersToKeep;

			// Update items to use the consolidated provider IDs
			if (dataContent.items && Array.isArray(dataContent.items)) {
				this.logger.debug(
					`Updating ${dataContent.items.length} items with consolidated provider IDs`
				);

				dataContent.items = dataContent.items.map(
					(item: Record<string, unknown>) => {
						const itemCopy = { ...item };

						if (
							itemCopy.providers &&
							Array.isArray(itemCopy.providers)
						) {
							itemCopy.providers = itemCopy.providers.map(
								(providerId: string) => {
									return (
										providerIdMap.get(providerId) ||
										providerId
									);
								}
							);
						}

						return itemCopy;
					}
				);
			}

			// Update transactions to use the consolidated provider IDs
			if (
				dataContent.transactions &&
				Array.isArray(dataContent.transactions)
			) {
				this.logger.debug(
					`Updating ${dataContent.transactions.length} transactions with consolidated provider IDs`
				);

				dataContent.transactions = dataContent.transactions.map(
					(transaction: Record<string, unknown>) => {
						const transactionCopy = { ...transaction };

						if (
							transactionCopy.provider &&
							typeof transactionCopy.provider === "string"
						) {
							const newProviderId = providerIdMap.get(
								transactionCopy.provider
							);
							if (newProviderId) {
								transactionCopy.provider = newProviderId;
							}
						}

						return transactionCopy;
					}
				);
			}
		}

		this.logger.debug(
			"Brand and provider consolidation migration completed"
		);
		return migratedData;
	}

	/**
	 * Generate a unique ID for new entities
	 */
	private generateId(): string {
		return UUIDValueObject.random().value;
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
