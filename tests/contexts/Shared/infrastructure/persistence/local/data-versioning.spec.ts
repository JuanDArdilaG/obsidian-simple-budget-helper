import { DataVersioning } from "contexts/Shared/infrastructure/persistence/local/data-versioning";
import { beforeEach, describe, expect, it } from "vitest";

describe("DataVersioning", () => {
	let dataVersioning: DataVersioning;

	beforeEach(() => {
		dataVersioning = new DataVersioning();
	});

	describe("Version Management", () => {
		it("should return current version as 1.4.0", () => {
			expect(dataVersioning.getCurrentVersion()).toBe("1.4.0");
		});
	});

	describe("Data Migration", () => {
		it("should skip migration for data already at current version", async () => {
			const currentVersionData = {
				version: "1.4.0",
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

		it("should migrate v1.3.0 transactions from old format to items-based format", async () => {
			const oldData = {
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "tx-1",
							name: "Groceries",
							category: "cat-food",
							subcategory: "sub-groceries",
							fromSplits: [
								{ accountId: "acc-1", amount: 50 },
								{ accountId: "acc-2", amount: 25 },
							],
							toSplits: [],
							operation: "expense",
							date: "2024-01-15",
							store: "SuperMarket",
							updatedAt: "2024-01-15T10:00:00.000Z",
						},
					],
				},
			};

			const result = (await dataVersioning.migrateData(oldData)) as {
				version: string;
				data: { transactions: Record<string, unknown>[] };
			};

			expect(result.version).toBe("1.4.0");
			const tx = result.data.transactions[0];
			expect(tx.items).toEqual([
				{
					name: "Groceries",
					price: 75,
					quantity: 1,
					categoryId: "cat-food",
					subcategoryId: "sub-groceries",
				},
			]);
			expect(tx.name).toBeUndefined();
			expect(tx.category).toBeUndefined();
			expect(tx.subcategory).toBeUndefined();
			expect(tx.id).toBe("tx-1");
			expect(tx.fromSplits).toEqual([
				{ accountId: "acc-1", amount: 50 },
				{ accountId: "acc-2", amount: 25 },
			]);
		});

		it("should use subCategory (deprecated) when subcategory is missing", async () => {
			const oldData = {
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "tx-2",
							name: "Coffee",
							category: "cat-food",
							subCategory: "sub-coffee",
							subcategory: "sub-ignored",
							fromSplits: [{ accountId: "acc-1", amount: 5 }],
							operation: "expense",
							date: "2024-01-15",
							updatedAt: "2024-01-15T10:00:00.000Z",
						},
					],
				},
			};

			const result = (await dataVersioning.migrateData(oldData)) as {
				version: string;
				data: { transactions: Record<string, unknown>[] };
			};

			const tx = result.data.transactions[0];
			expect((tx.items as Record<string, unknown>[])[0].subcategoryId).toBe(
				"sub-coffee"
			);
		});

		it("should not re-migrate transactions that already have items array", async () => {
			const mixedData = {
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "tx-new",
							fromSplits: [{ accountId: "acc-1", amount: 10 }],
							operation: "expense",
							date: "2024-01-15",
							items: [
								{
									name: "Already migrated",
									price: 10,
									quantity: 1,
									categoryId: "cat-1",
									subcategoryId: "sub-1",
								},
							],
							updatedAt: "2024-01-15T10:00:00.000Z",
						},
					],
				},
			};

			const result = (await dataVersioning.migrateData(mixedData)) as {
				version: string;
				data: { transactions: Record<string, unknown>[] };
			};

			const tx = result.data.transactions[0];
			expect((tx.items as Record<string, unknown>[]).length).toBe(1);
			expect((tx.items as Record<string, unknown>[])[0].name).toBe(
				"Already migrated"
			);
		});

		it("should handle data with no transactions gracefully", async () => {
			const dataNoTx = {
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					accounts: [{ id: "acc-1" }],
				},
			};

			const result = (await dataVersioning.migrateData(dataNoTx)) as {
				version: string;
				data: Record<string, unknown>;
			};

			expect(result.version).toBe("1.4.0");
			expect(result.data.accounts).toEqual([{ id: "acc-1" }]);
		});
	});

	describe("Data Structure Validation", () => {
		it("should validate correct data structure", () => {
			const validData = {
				version: "1.4.0",
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
				version: "1.4.0",
				data: {},
			};

			expect(dataVersioning.validateDataStructure(invalidData)).toBe(
				false
			);
		});

		it("should reject invalid data structure - missing data", () => {
			const invalidData = {
				version: "1.4.0",
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
			const versionInfo = dataVersioning.getVersionInfo("1.4.0");

			expect(versionInfo).toBeDefined();
			expect(versionInfo?.version).toBe("1.4.0");
			expect(versionInfo?.compatibleVersions).toContain("1.4.0");
		});

		it("should return undefined for unknown version", () => {
			const versionInfo = dataVersioning.getVersionInfo("2.0.0");

			expect(versionInfo).toBeUndefined();
		});

		it("should return all versions", () => {
			const versions = dataVersioning.getAllVersions();

			expect(versions).toBeInstanceOf(Array);
			expect(versions.length).toBeGreaterThanOrEqual(2);
			expect(versions.some((v) => v.version === "1.3.0")).toBe(true);
			expect(versions.some((v) => v.version === "1.4.0")).toBe(true);
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
				version: "1.5.0",
				compatibleVersions: ["1.4.0", "1.5.0"],
				migrationScript: undefined,
			});

			const futureData = {
				version: "1.5.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {},
			};

			// Since current version is still 1.4.0, trying to migrate from 1.5.0 should fail
			await expect(
				dataVersioning.migrateData(futureData)
			).rejects.toThrow("Downgrade not supported");
		});
	});
});
