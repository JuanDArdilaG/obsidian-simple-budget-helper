import { DataVersioning } from "contexts/Shared/infrastructure/persistence/local/data-versioning";
import { beforeEach, describe, expect, it } from "vitest";

describe("DataVersioning", () => {
	let dataVersioning: DataVersioning;

	beforeEach(() => {
		dataVersioning = new DataVersioning();
	});

	describe("Version Management", () => {
		it("should return current version as 1.3.0", () => {
			expect(dataVersioning.getCurrentVersion()).toBe("1.3.0");
		});
	});

	describe("Data Migration", () => {
		it("should skip migration for data already at current version", async () => {
			const currentVersionData = {
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [],
					items: [],
					brands: [],
					providers: [],
					recurrenceModifications: [],
					stores: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				currentVersionData
			);

			expect(migratedData).toEqual(currentVersionData);
		});

		it("should throw error for migrating from unsupported old versions", async () => {
			const oldData = {
				version: "1.0.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [],
				},
			};

			await expect(dataVersioning.migrateData(oldData)).rejects.toThrow(
				"Version not found"
			);
		});
	});

	describe("Data Structure Validation", () => {
		it("should validate correct data structure", () => {
			const validData = {
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [],
				},
			};

			expect(dataVersioning.validateDataStructure(validData)).toBe(true);
		});

		it("should reject invalid data structure - missing version", () => {
			const invalidData = {
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {},
			};

			expect(dataVersioning.validateDataStructure(invalidData)).toBe(
				false
			);
		});

		it("should reject invalid data structure - missing timestamp", () => {
			const invalidData = {
				version: "1.3.0",
				data: {},
			};

			expect(dataVersioning.validateDataStructure(invalidData)).toBe(
				false
			);
		});

		it("should reject invalid data structure - missing data", () => {
			const invalidData = {
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
			};

			expect(dataVersioning.validateDataStructure(invalidData)).toBe(
				false
			);
		});

		it("should reject null data", () => {
			expect(dataVersioning.validateDataStructure(null)).toBe(false);
		});

		it("should reject non-object data", () => {
			expect(dataVersioning.validateDataStructure("string")).toBe(false);
			expect(dataVersioning.validateDataStructure(123)).toBe(false);
		});
	});

	describe("Version Information", () => {
		it("should return version info for current version", () => {
			const versionInfo = dataVersioning.getVersionInfo("1.3.0");

			expect(versionInfo).toBeDefined();
			expect(versionInfo?.version).toBe("1.3.0");
			expect(versionInfo?.compatibleVersions).toContain("1.3.0");
		});

		it("should return undefined for unknown version", () => {
			const versionInfo = dataVersioning.getVersionInfo("2.0.0");

			expect(versionInfo).toBeUndefined();
		});

		it("should return all versions", () => {
			const versions = dataVersioning.getAllVersions();

			expect(versions).toBeInstanceOf(Array);
			expect(versions.length).toBeGreaterThan(0);
			expect(versions.some((v) => v.version === "1.3.0")).toBe(true);
		});
	});

	describe("Error Handling", () => {
		it("should throw error for invalid data format", async () => {
			const invalidData = null;

			await expect(
				dataVersioning.migrateData(invalidData)
			).rejects.toThrow("Invalid data format for migration");
		});

		it("should throw error for downgrade attempts", async () => {
			// Add a future version temporarily for testing
			dataVersioning.addVersion({
				version: "1.4.0",
				compatibleVersions: ["1.3.0", "1.4.0"],
				migrationScript: undefined,
			});

			const futureData = {
				version: "1.4.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {},
			};

			// Since current version is still 1.3.0, trying to migrate from 1.4.0 should fail
			await expect(
				dataVersioning.migrateData(futureData)
			).rejects.toThrow("Downgrade not supported");
		});
	});
});
