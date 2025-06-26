import { DataVersioning } from "contexts/Shared/infrastructure/persistence/local/data-versioning";
import { beforeEach, describe, expect, it } from "vitest";

describe("LocalDB Migration Integration", () => {
	let dataVersioning: DataVersioning;

	beforeEach(() => {
		dataVersioning = new DataVersioning();
	});

	describe("Migration Logic", () => {
		it("should migrate data when version is different from current", async () => {
			const oldData = {
				version: "1.0.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "transaction-1",
							name: "Test Transaction",
							category: "category-1",
							subCategory: "subcategory-1",
							account: "account-1",
							amount: 100,
							operation: "expense",
							date: new Date("2024-01-01"),
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					accounts: [],
					categories: [],
					items: [],
					subcategories: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			// Verify that migration was performed
			expect(migratedData).toEqual({
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "transaction-1",
							name: "Test Transaction",
							category: "category-1",
							subCategory: "subcategory-1",
							fromSplits: [
								{
									accountId: "account-1",
									amount: 100,
								},
							],
							toSplits: [],
							operation: "expense",
							date: new Date("2024-01-01"),
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					accounts: [],
					brands: [],
					categories: [],
					items: [],
					providers: [],
					stores: [],
					subcategories: [],
				},
			});
		});

		it("should not migrate data when version is current", async () => {
			const currentData = {
				version: "1.2.2", // Current version
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "transaction-1",
							name: "Test Transaction",
							category: "category-1",
							subCategory: "subcategory-1",
							fromSplits: [
								{
									accountId: "account-1",
									amount: 100,
								},
							],
							toSplits: [],
							operation: "expense",
							date: new Date("2024-01-01"),
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					accounts: [],
					brands: [],
					categories: [],
					items: [],
					providers: [],
					stores: [],
					subcategories: [],
				},
			};

			const result = await dataVersioning.migrateData(currentData);

			// Verify that no migration was performed (data should be unchanged)
			expect(result).toEqual(currentData);
		});

		it("should handle version comparison correctly", () => {
			const currentVersion = dataVersioning.getCurrentVersion();

			// Test that different versions trigger migration
			expect(currentVersion).toBe("1.2.2");
			expect("1.0.0" !== currentVersion).toBe(true);
			expect("1.2.2" === currentVersion).toBe(true);
		});
	});
});
