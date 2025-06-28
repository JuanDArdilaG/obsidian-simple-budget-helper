import { DataVersioning } from "contexts/Shared/infrastructure/persistence/local/data-versioning";
import { beforeEach, describe, expect, it } from "vitest";

describe("DataVersioning", () => {
	let dataVersioning: DataVersioning;

	beforeEach(() => {
		dataVersioning = new DataVersioning();
	});

	describe("Version Management", () => {
		it("should return current version as 1.2.3", () => {
			expect(dataVersioning.getCurrentVersion()).toBe("1.2.3");
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

		it("should be compatible with version 1.2.3", () => {
			expect(dataVersioning.isCompatible("1.2.3")).toBe(true);
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
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			expect(migratedData).toEqual({
				version: "1.2.3",
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
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			expect(migratedData).toEqual({
				version: "1.2.3",
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
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			expect(migratedData).toEqual({
				version: "1.2.3",
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
				},
			};

			const migratedData = await dataVersioning.migrateData(newData);

			expect(migratedData).toEqual({
				version: "1.2.3",
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
							name: "Old Format Transaction",
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
							name: "New Format Transaction",
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
							date: new Date("2024-01-01"),
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(mixedData);

			expect(migratedData).toEqual({
				version: "1.2.3",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					items: [],
					providers: [],
					stores: [],
					transactions: [
						{
							id: "transaction-1",
							name: "Old Format Transaction",
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
							name: "New Format Transaction",
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
							date: new Date("2024-01-01"),
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
				},
			});
		});

		it("should handle empty data gracefully", async () => {
			const emptyData = {
				version: "1.0.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {},
			};

			const migratedData = await dataVersioning.migrateData(emptyData);

			expect(migratedData).toEqual({
				version: "1.2.3",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [],
					items: [],
					providers: [],
					stores: [],
				},
			});
		});

		it("should handle data without transactions or items", async () => {
			const dataWithoutItems = {
				version: "1.0.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					accounts: [
						{
							id: "account-1",
							name: "Test Account",
						},
					],
					categories: [
						{
							id: "category-1",
							name: "Test Category",
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithoutItems
			);

			expect(migratedData).toEqual({
				version: "1.2.3",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					accounts: [
						{
							id: "account-1",
							name: "Test Account",
						},
					],
					brands: [],
					categories: [
						{
							id: "category-1",
							name: "Test Category",
						},
					],
					items: [],
					providers: [],
					stores: [],
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
							brand: "Test Brand",
							store: "Test Store",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(oldData);

			expect(migratedData).toEqual({
				version: "1.2.3",
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
							brand: "Test Brand",
							store: "Test Store",
							updatedAt: "2024-01-01T00:00:00.000Z",
						},
					],
				},
			});
		});
	});

	describe("Brand and Provider Consolidation Migration (1.2.3)", () => {
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
				version: "1.2.3",
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
				version: "1.2.3",
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
						{
							id: "item2",
							name: "Streaming",
							providers: ["provider1"],
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithoutDuplicates
			);

			expect(migratedData).toEqual({
				version: "1.2.3",
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
						{
							id: "item2",
							name: "Streaming",
							providers: ["provider1"],
						},
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
				version: "1.2.3",
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
				version: "1.2.3",
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
						{
							id: "brand3",
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
							name: "Netflix",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Duplicate
					],
					items: [
						{
							id: "item1",
							name: "Multi-Brand Item",
							brands: ["brand1", "brand2", "brand3"], // Contains duplicate
						},
						{
							id: "item2",
							name: "Multi-Provider Item",
							providers: ["provider1", "provider2"], // Contains duplicate
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithMultipleReferences
			);

			expect(migratedData).toEqual({
				version: "1.2.3",
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
							name: "Multi-Brand Item",
							brands: ["brand1", "brand1", "brand3"], // Duplicate replaced with kept brand
						},
						{
							id: "item2",
							name: "Multi-Provider Item",
							providers: ["provider1", "provider1"], // Duplicate replaced with kept provider
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
						{
							id: "item1",
							name: "Test Item",
							brands: [],
							providers: [],
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithEmptyArrays
			);

			expect(migratedData).toEqual({
				version: "1.2.3",
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
				version: "1.2.3",
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
					accounts: [
						{ id: "account1", name: "Checking" },
						{ id: "account2", name: "Savings" },
					],
					categories: [
						{ id: "cat1", name: "Food" },
						{ id: "cat2", name: "Transport" },
					],
					items: [
						{ id: "item1", name: "Shoes", brands: ["brand1"] },
						{ id: "item2", name: "Shirt", brands: ["brand2"] }, // References duplicate
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(
				dataWithOtherProperties
			);

			expect(migratedData).toEqual({
				version: "1.2.3",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					brands: [
						{
							id: "brand1",
							name: "Nike",
							updatedAt: "2024-01-01T00:00:00.000Z",
						}, // Kept
					],
					accounts: [
						{ id: "account1", name: "Checking" },
						{ id: "account2", name: "Savings" },
					],
					categories: [
						{ id: "cat1", name: "Food" },
						{ id: "cat2", name: "Transport" },
					],
					items: [
						{ id: "item1", name: "Shoes", brands: ["brand1"] },
						{ id: "item2", name: "Shirt", brands: ["brand1"] }, // Updated to reference kept brand
					],
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
