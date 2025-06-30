import { DataVersioning } from "contexts/Shared/infrastructure/persistence/local/data-versioning";
import { beforeEach, describe, expect, it } from "vitest";

describe("DataVersioning", () => {
	let dataVersioning: DataVersioning;

	beforeEach(() => {
		dataVersioning = new DataVersioning();
	});

	describe("Version Management", () => {
		it("should return current version as 1.2.6", () => {
			expect(dataVersioning.getCurrentVersion()).toBe("1.2.6");
		});

		it("should be compatible with version 1.0.0", () => {
			expect(dataVersioning.isCompatible("1.0.0")).toBe(true);
		});

		it("should be compatible with version 1.1.0", () => {
			expect(dataVersioning.isCompatible("1.1.0")).toBe(true);
		});

		it("should be compatible with version 1.2.2", () => {
			expect(dataVersioning.isCompatible("1.2.2")).toBe(true);
		});

		it("should be compatible with version 1.2.4", () => {
			expect(dataVersioning.isCompatible("1.2.4")).toBe(true);
		});

		it("should not be compatible with unknown version", () => {
			expect(dataVersioning.isCompatible("2.0.0")).toBe(false);
		});
	});

	describe("Migration Script", () => {
		it("should migrate transaction from old format to payment splits format", async () => {
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
					items: [],
					brands: [],
					providers: [],
					stores: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					items: [],
					providers: [],
					stores: [],
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
				},
			});
		});

		it("should migrate transaction with transfer operation", async () => {
			const oldData = {
				version: "1.0.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "transaction-1",
							name: "Transfer",
							category: "category-1",
							subCategory: "subcategory-1",
							account: "account-1",
							toAccount: "account-2",
							amount: 100,
							operation: "transfer",
							date: new Date("2024-01-01"),
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					items: [],
					brands: [],
					providers: [],
					stores: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					items: [],
					providers: [],
					stores: [],
					transactions: [
						{
							id: "transaction-1",
							name: "Transfer",
							category: "category-1",
							subCategory: "subcategory-1",
							fromSplits: [
								{
									accountId: "account-1",
									amount: 100,
								},
							],
							toSplits: [
								{
									accountId: "account-2",
									amount: 100,
								},
							],
							operation: "transfer",
							date: new Date("2024-01-01"),
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
				},
			});
		});

		it("should migrate item from old format to payment splits format", async () => {
			const oldData = {
				version: "1.0.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					items: [
						{
							id: "item-1",
							name: "Test Item",
							category: "category-1",
							subCategory: "subcategory-1",
							account: "account-1",
							amount: 50,
							operation: "expense",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					brands: [],
					providers: [],
					stores: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					items: [],
					providers: [],
					stores: [],
				},
			});
		});

		it("should skip migration for data already in new format", async () => {
			const newData = {
				version: "1.0.0",
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
					items: [],
					brands: [],
					providers: [],
					stores: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(newData);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					items: [],
					providers: [],
					stores: [],
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
				},
			});
		});

		it("should handle mixed old and new format data", async () => {
			const mixedData = {
				version: "1.0.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "transaction-1",
							name: "Old Format",
							category: "category-1",
							subCategory: "subcategory-1",
							account: "account-1",
							amount: 100,
							operation: "expense",
							date: new Date("2024-01-01"),
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "transaction-2",
							name: "New Format",
							category: "category-1",
							subCategory: "subcategory-1",
							fromSplits: [
								{
									accountId: "account-2",
									amount: 200,
								},
							],
							toSplits: [],
							operation: "expense",
							date: new Date("2024-01-02"),
							updatedAt: "2024-01-02T00:00:00.000Z",
						},
					],
					items: [],
					brands: [],
					providers: [],
					stores: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(mixedData);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					items: [],
					providers: [],
					stores: [],
					transactions: [
						{
							id: "transaction-1",
							name: "Old Format",
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
						{
							id: "transaction-2",
							name: "New Format",
							category: "category-1",
							subCategory: "subcategory-1",
							fromSplits: [
								{
									accountId: "account-2",
									amount: 200,
								},
							],
							toSplits: [],
							operation: "expense",
							date: new Date("2024-01-02"),
							updatedAt: "2024-01-02T00:00:00.000Z",
						},
					],
				},
			});
		});

		it("should handle empty data gracefully", async () => {
			const emptyData = {
				version: "1.0.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [],
					items: [],
					brands: [],
					providers: [],
					stores: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(emptyData);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					items: [],
					providers: [],
					stores: [],
					transactions: [],
				},
			});
		});

		it("should handle data without transactions or items", async () => {
			const dataWithoutTransactions = {
				version: "1.2.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand-1",
							name: "Test Brand",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					providers: [],
					stores: [],
					transactions: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithoutTransactions
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand-1",
							name: "Test Brand",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					providers: [],
					stores: [],
					transactions: [],
				},
			});
		});

		it("should preserve all other properties during migration", async () => {
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
							customField: "custom value",
						},
					],
					items: [],
					brands: [],
					providers: [],
					stores: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					items: [],
					providers: [],
					stores: [],
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
							customField: "custom value",
						},
					],
				},
			});
		});
	});

	describe("Brand and Provider Consolidation Migration (1.2.4)", () => {
		it("should consolidate duplicate brands and update references", async () => {
			const dataWithDuplicateBrands = {
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "brand2",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Duplicate
						{
							id: "brand3",
							name: "Adidas",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "brand4",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Another duplicate
					],
					items: [
						{ id: "item1", name: "Shoes", brands: ["brand1"] },
						{ id: "item2", name: "Shirt", brands: ["brand2"] }, // References duplicate
						{ id: "item3", name: "Pants", brands: ["brand3"] },
						{ id: "item4", name: "Hat", brands: ["brand4"] }, // References duplicate
					],
					transactions: [
						{ id: "tx1", name: "Purchase", brand: "brand1" },
						{ id: "tx2", name: "Purchase", brand: "brand2" }, // References duplicate
						{ id: "tx3", name: "Purchase", brand: "brand4" }, // References duplicate
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithDuplicateBrands
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Kept
						{
							id: "brand3",
							name: "Adidas",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					items: [
						{ id: "item1", name: "Shoes", brands: ["brand1"] },
						{ id: "item2", name: "Shirt", brands: ["brand1"] }, // Updated to reference kept brand
						{ id: "item3", name: "Pants", brands: ["brand3"] },
						{ id: "item4", name: "Hat", brands: ["brand1"] }, // Updated to reference kept brand
					],
					transactions: [
						{ id: "tx1", name: "Purchase", brand: "brand1" },
						{ id: "tx2", name: "Purchase", brand: "brand1" }, // Updated to reference kept brand
						{ id: "tx3", name: "Purchase", brand: "brand1" }, // Updated to reference kept brand
					],
				},
			});
		});

		it("should consolidate duplicate providers and update references", async () => {
			const dataWithDuplicateProviders = {
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					providers: [
						{
							id: "provider1",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "provider2",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Duplicate
						{
							id: "provider3",
							name: "Spotify",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					items: [
						{
							id: "item1",
							name: "Streaming",
							providers: ["provider1"],
						},
						{
							id: "item2",
							name: "Music",
							providers: ["provider2"],
						}, // References duplicate
						{
							id: "item3",
							name: "Premium",
							providers: ["provider3"],
						},
					],
					transactions: [
						{
							id: "tx1",
							name: "Subscription",
							provider: "provider1",
						},
						{
							id: "tx2",
							name: "Subscription",
							provider: "provider2",
						}, // References duplicate
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithDuplicateProviders
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					providers: [
						{
							id: "provider1",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Kept
						{
							id: "provider3",
							name: "Spotify",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					items: [
						{
							id: "item1",
							name: "Streaming",
							providers: ["provider1"],
						},
						{
							id: "item2",
							name: "Music",
							providers: ["provider1"],
						}, // Updated to reference kept provider
						{
							id: "item3",
							name: "Premium",
							providers: ["provider3"],
						},
					],
					transactions: [
						{
							id: "tx1",
							name: "Subscription",
							provider: "provider1",
						},
						{
							id: "tx2",
							name: "Subscription",
							provider: "provider1",
						}, // Updated to reference kept provider
					],
				},
			});
		});

		it("should handle data with no duplicates", async () => {
			const dataWithoutDuplicates = {
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "brand2",
							name: "Adidas",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					providers: [
						{
							id: "provider1",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "provider2",
							name: "Spotify",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					items: [
						{ id: "item1", name: "Shoes", brands: ["brand1"] },
						{ id: "item2", name: "Shirt", brands: ["brand2"] },
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithoutDuplicates
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "brand2",
							name: "Adidas",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					providers: [
						{
							id: "provider1",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "provider2",
							name: "Spotify",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
					items: [
						{ id: "item1", name: "Shoes", brands: ["brand1"] },
						{ id: "item2", name: "Shirt", brands: ["brand2"] },
					],
				},
			});
		});

		it("should handle data with only brands and no providers", async () => {
			const dataWithOnlyBrands = {
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "brand2",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Duplicate
					],
					items: [
						{ id: "item1", name: "Shoes", brands: ["brand1"] },
						{ id: "item2", name: "Shirt", brands: ["brand2"] }, // References duplicate
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithOnlyBrands
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Kept
					],
					items: [
						{ id: "item1", name: "Shoes", brands: ["brand1"] },
						{ id: "item2", name: "Shirt", brands: ["brand1"] }, // Updated to reference kept brand
					],
				},
			});
		});

		it("should handle data with only providers and no brands", async () => {
			const dataWithOnlyProviders = {
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					providers: [
						{
							id: "provider1",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "provider2",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Duplicate
					],
					items: [
						{
							id: "item1",
							name: "Streaming",
							providers: ["provider1"],
						},
						{
							id: "item2",
							name: "Premium",
							providers: ["provider2"],
						}, // References duplicate
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithOnlyProviders
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					providers: [
						{
							id: "provider1",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Kept
					],
					items: [
						{
							id: "item1",
							name: "Streaming",
							providers: ["provider1"],
						},
						{
							id: "item2",
							name: "Premium",
							providers: ["provider1"],
						}, // Updated to reference kept provider
					],
				},
			});
		});

		it("should handle items with multiple brands/providers", async () => {
			const dataWithMultipleReferences = {
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "brand2",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Duplicate
					],
					providers: [
						{
							id: "provider1",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "provider2",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Duplicate
					],
					items: [
						{
							id: "item1",
							name: "Shoes",
							brands: ["brand1", "brand2"], // Multiple brands, one is duplicate
						},
						{
							id: "item2",
							name: "Streaming",
							providers: ["provider1", "provider2"], // Multiple providers, one is duplicate
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithMultipleReferences
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Kept
					],
					providers: [
						{
							id: "provider1",
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Kept
					],
					items: [
						{
							id: "item1",
							name: "Shoes",
							brands: ["brand1", "brand1"], // Both updated to reference kept brand
						},
						{
							id: "item2",
							name: "Streaming",
							providers: ["provider1", "provider1"], // Both updated to reference kept provider
						},
					],
				},
			});
		});

		it("should handle empty brands and providers arrays", async () => {
			const dataWithEmptyArrays = {
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					providers: [],
					items: [
						{ id: "item1", name: "Test Item", brands: [] },
						{ id: "item2", name: "Test Item", providers: [] },
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithEmptyArrays
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					providers: [],
					items: [
						{
							id: "item1",
							name: "Test Item",
							brands: [],
							providers: [],
						},
					],
				},
			});
		});

		it("should handle missing brands and providers arrays", async () => {
			const dataWithMissingArrays = {
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					items: [{ id: "item1", name: "Test Item" }],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithMissingArrays
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					items: [{ id: "item1", name: "Test Item" }],
				},
			});
		});

		it("should preserve other data properties during consolidation", async () => {
			const dataWithOtherProperties = {
				version: "1.2.2",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
						{
							id: "brand2",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Duplicate
					],
					items: [
						{
							id: "item1",
							name: "Shoes",
							brands: ["brand1"],
							category: "Clothing",
							price: 100,
						},
						{
							id: "item2",
							name: "Shirt",
							brands: ["brand2"], // References duplicate
							category: "Clothing",
							price: 50,
						},
					],
					transactions: [
						{
							id: "tx1",
							name: "Purchase",
							brand: "brand1",
							amount: 100,
							date: "2024-01-01",
						},
						{
							id: "tx2",
							name: "Purchase",
							brand: "brand2", // References duplicate
							amount: 50,
							date: "2024-01-01",
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithOtherProperties
			);

			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Kept
					],
					items: [
						{
							id: "item1",
							name: "Shoes",
							brands: ["brand1"],
							category: "Clothing",
							price: 100,
						},
						{
							id: "item2",
							name: "Shirt",
							brands: ["brand1"], // Updated to reference kept brand
							category: "Clothing",
							price: 50,
						},
					],
					transactions: [
						{
							id: "tx1",
							name: "Purchase",
							brand: "brand1",
							amount: 100,
							date: "2024-01-01",
						},
						{
							id: "tx2",
							name: "Purchase",
							brand: "brand1", // Updated to reference kept brand
							amount: 50,
							date: "2024-01-01",
						},
					],
				},
			});
		});
	});

	describe("Migration to New ItemOperation Structure and Recurrence Splits (1.2.5)", () => {
		it("should handle real-world migration scenario from 1.2.5 to 1.2.6", async () => {
			// Simulate real data that would exist in a user's database
			const oldData = {
				version: "1.2.5",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					accounts: [
						{ id: "account-1", name: "Checking Account" },
						{ id: "account-2", name: "Savings Account" },
					],
					categories: [{ id: "cat-1", name: "Food" }],
					items: [{ id: "item-1", name: "Groceries" }],
					scheduledItems: [
						{
							id: "scheduled-1",
							name: "Monthly Transfer",
							account: "account-1",
							toAccount: "account-2",
							amount: 1000,
							// Missing fromSplits and toSplits - this should be added by migration
							operation: {
								id: "op-1",
								type: "transfer",
							},
						},
						{
							id: "scheduled-2",
							name: "Expense Item",
							account: "account-1",
							amount: 1000,
							// Missing fromSplits and toSplits - this should be added by migration
							operation: {
								id: "op-2",
								type: "expense",
							},
						},
						{
							id: "scheduled-3",
							name: "Transfer with Partial Data",
							account: "account-1",
							toAccount: "account-2",
							amount: 500,
							fromSplits: [
								{
									accountId: "account-1",
									amount: 500,
								},
							],
							toSplits: [], // Empty toSplits for transfer - should be filled
							operation: {
								id: "op-3",
								type: "transfer",
							},
						},
					],
					brands: [],
					stores: [],
					providers: [],
					subCategories: [],
					transactions: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			// Verify the migration worked correctly
			expect(migratedData).toEqual({
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					accounts: [
						{ id: "account-1", name: "Checking Account" },
						{ id: "account-2", name: "Savings Account" },
					],
					categories: [{ id: "cat-1", name: "Food" }],
					items: [{ id: "item-1", name: "Groceries" }],
					scheduledItems: [
						{
							id: "scheduled-1",
							name: "Monthly Transfer",
							fromSplits: [
								{
									accountId: "account-1",
									amount: 1000,
								},
							], // Added by migration
							toSplits: [
								{
									accountId: "account-2", // Placeholder for transfer
									amount: 1000,
								},
							], // Added by migration with placeholder
							operation: {
								id: "op-1",
								type: "transfer",
							},
						},
						{
							id: "scheduled-2",
							name: "Expense Item",
							fromSplits: [
								{
									accountId: "account-1",
									amount: 1000,
								},
							], // Added by migration
							toSplits: [], // Added by migration
							operation: {
								id: "op-2",
								type: "expense",
							},
						},
						{
							id: "scheduled-3",
							name: "Transfer with Partial Data",
							fromSplits: [
								{
									accountId: "account-1",
									amount: 500,
								},
							],
							toSplits: [
								{
									accountId: "account-2",
									amount: 500,
								},
							], // Filled from fromSplits
							operation: {
								id: "op-3",
								type: "transfer",
							},
						},
					],
					brands: [],
					stores: [],
					providers: [],
					subCategories: [],
					transactions: [],
				},
			});
		});
	});

	describe("Error Handling", () => {
		it("should throw error for invalid data format", async () => {
			const invalidData = null;

			await expect(
				dataVersioning.migrateData(invalidData)
			).rejects.toThrow("Invalid data format for migration");
		});

		it("should throw error for invalid data structure in migration", async () => {
			const invalidData = {
				version: "1.0.0",
				// Missing timestamp and data
			};

			await expect(
				dataVersioning.migrateData(invalidData)
			).rejects.toThrow(
				"Invalid data format for payment splits migration"
			);
		});
	});
});
