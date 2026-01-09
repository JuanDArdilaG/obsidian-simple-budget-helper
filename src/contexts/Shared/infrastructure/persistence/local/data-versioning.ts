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
			version: "1.3.0",
			compatibleVersions: ["1.3.0"],
			migrationScript: undefined,
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
