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

export class DataVersioning {
	private logger: Logger = new Logger("DataVersioning");
	private currentVersion = "1.3.0";
	private versions: DataVersion[] = [
		{
			version: "1.2.6",
			compatibleVersions: ["1.2.6"],
			migrationScript: undefined,
		},
		{
			version: "1.3.0",
			compatibleVersions: ["1.2.6", "1.3.0"],
			migrationScript: this.migrateToScheduledItemsV2.bind(this),
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
					this.logger.debug(`Applying migration to ${version}`);
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
			this.logger.error("Data migration error", error);
			throw error;
		}
	}

	/**
	 * Migration script to convert V1 scheduled items to V2 structure with immutable recurrence patterns
	 * This migrates data from version 1.2.6 to 1.3.0
	 */
	private async migrateToScheduledItemsV2(data: unknown): Promise<unknown> {
		this.logger.debug("Starting migration to Scheduled Items V2 structure");

		if (!data || typeof data !== "object") {
			throw new Error("Invalid data format for V2 migration");
		}

		const dataObj = data as MigrationData;

		// Ensure we have the data structure
		if (
			!dataObj.data ||
			typeof dataObj.data !== "object" ||
			dataObj.data === null
		) {
			throw new Error("Invalid data format for V2 migration");
		}

		const migratedData = { ...dataObj };
		const dataContent = migratedData.data as Record<string, unknown>;

		// Initialize the recurrence modifications table for V2
		// This is added to all 1.3.0 data to indicate schema support
		dataContent.recurrenceModifications = [];

		// Migrate scheduled items to V2 structure
		if (
			dataContent.scheduledItems &&
			Array.isArray(dataContent.scheduledItems) &&
			dataContent.scheduledItems.length > 0
		) {
			this.logger.debug(
				`Migrating ${dataContent.scheduledItems.length} scheduled items to V2 structure`
			);

			dataContent.scheduledItems = dataContent.scheduledItems.map(
				(item: Record<string, unknown>) => {
					return this.migrateScheduledItemToV2(item);
				}
			);
		}

		this.logger.debug("Scheduled Items V2 migration completed");
		return migratedData;
	}

	/**
	 * Convert a V1 scheduled item to V2 structure
	 */
	private migrateScheduledItemToV2(
		item: Record<string, unknown>
	): Record<string, unknown> {
		const migratedItem = { ...item };

		// Convert V1 recurrence structure to enhanced V2-compatible structure
		const enhancedRecurrence = this.enhanceV1RecurrenceForV2(item);
		migratedItem.recurrence = enhancedRecurrence;

		migratedItem.createdAt =
			migratedItem.createdAt || new Date().toISOString();

		this.logger.debug("Enhanced scheduled item for V2 compatibility", {
			id: item.id,
			recurrenceType: (
				enhancedRecurrence.v2Pattern as Record<string, unknown>
			)?.type,
		});

		return migratedItem;
	}

	/**
	 * Enhance V1 recurrence structure with V2 pattern information
	 */
	private enhanceV1RecurrenceForV2(
		item: Record<string, unknown>
	): Record<string, unknown> {
		const recurrence = (item.recurrence as Record<string, unknown>) || {};
		// V2: Remove static recurrences array - recurrences will be calculated dynamically
		// from scheduled item info and recurrence modifications table
		delete recurrence.recurrences;

		// Create V2 pattern alongside V1 structure for future use
		const v2Pattern = this.createV2RecurrencePattern(item);

		// Enhanced recurrence maintains V1 structure but adds V2 information
		const enhancedRecurrence = {
			...recurrence,
			// V2 enhancements
			v2Pattern: v2Pattern,
			isImmutable: true, // V2 patterns are immutable
			migrationDate: new Date().toISOString(),
			// Preserve V1 fields for compatibility
			startDate:
				recurrence.startDate || item.date || new Date().toISOString(),
			frequency: this.convertFrequencyStringToObject(
				item.frequency as string
			),
			untilDate: recurrence.untilDate,
		};

		return enhancedRecurrence;
	}

	/**
	 * Convert old frequency string to structured frequency object
	 */
	private convertFrequencyStringToObject(
		frequency?: string
	): Record<string, unknown> | undefined {
		if (!frequency) return undefined;

		// Basic frequency conversion - could be enhanced based on existing patterns
		return {
			value: frequency,
			type: "string", // Mark as legacy string type
		};
	}

	/**
	 * Create V2 recurrence pattern from V1 data
	 */
	private createV2RecurrencePattern(
		item: Record<string, unknown>
	): Record<string, unknown> {
		const frequency = item.frequency as string;
		const recurrenceType = item.recurrenceType as string;
		const maxOccurrences = item.maxOccurrences as number;
		const untilDate = item.untilDate as string;
		const startDate = (item.date as string) || new Date().toISOString();

		// Map V1 recurrence types to V2
		let v2Type: string;
		let v2Frequency: string | undefined;
		let v2EndDate: string | undefined;
		let v2MaxOccurrences: number | undefined;

		switch (recurrenceType) {
			case "none":
			case "one-time":
			default:
				v2Type = "one-time";
				break;
			case "infinite":
				v2Type = "infinite";
				v2Frequency = frequency || "1mo"; // default to monthly if missing
				break;
			case "until-date":
				v2Type = "until-date";
				v2Frequency = frequency || "1mo";
				v2EndDate = untilDate;
				break;
			case "n-occurrences":
				v2Type = "n-occurrences";
				v2Frequency = frequency || "1mo";
				v2MaxOccurrences = maxOccurrences || 1;
				break;
		}

		const pattern: Record<string, unknown> = {
			type: v2Type,
			startDate: startDate,
		};

		if (v2Frequency) {
			pattern.frequency = v2Frequency;
		}
		if (v2EndDate) {
			pattern.endDate = v2EndDate;
		}
		if (v2MaxOccurrences) {
			pattern.maxOccurrences = v2MaxOccurrences;
		}

		return pattern;
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
			this.logger.error("Data validation error", error);
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
