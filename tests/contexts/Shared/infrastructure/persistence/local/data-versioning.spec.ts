import { DataVersioning } from "contexts/Shared/infrastructure/persistence/local/data-versioning";
import { beforeEach, describe, expect, it } from "vitest";

describe("DataVersioning", () => {
	let dataVersioning: DataVersioning;

	beforeEach(() => {
		dataVersioning = new DataVersioning();
	});

	describe("Version Management", () => {
		it("should return current version as 1.2.2", () => {
			expect(dataVersioning.getCurrentVersion()).toBe("1.2.2");
		});

		it("should be compatible with version 1.0.0", () => {
			expect(dataVersioning.isCompatible("1.0.0")).toBe(true);
		});

		it("should be compatible with version 1.1.0", () => {
			expect(dataVersioning.isCompatible("1.1.0")).toBe(true);
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
				version: "1.2.2",
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
				version: "1.2.2",
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
				version: "1.2.2",
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
				version: "1.2.2",
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
				version: "1.2.2",
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
				version: "1.2.2",
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
				version: "1.2.2",
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
				version: "1.2.2",
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
