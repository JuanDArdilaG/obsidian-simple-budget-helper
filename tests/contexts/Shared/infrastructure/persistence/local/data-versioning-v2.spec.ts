import { DataVersioning } from "contexts/Shared/infrastructure/persistence/local/data-versioning";
import { beforeEach, describe, expect, it } from "vitest";

describe("DataVersioning V2 Migration", () => {
	let dataVersioning: DataVersioning;

	beforeEach(() => {
		dataVersioning = new DataVersioning();
	});

	describe("Version 1.3.0 - Scheduled Items V2 Migration", () => {
		it("should return current version as 1.3.0", () => {
			expect(dataVersioning.getCurrentVersion()).toBe("1.3.0");
		});

		it("should be compatible with version 1.3.0", () => {
			expect(dataVersioning.isCompatible("1.3.0")).toBe(true);
		});

		it("should migrate V1 scheduled item with one-time recurrence to V2 structure", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "One-time Payment",
							date: "2024-02-01T00:00:00.000Z",
							recurrenceType: "none",
							frequency: undefined,
							maxOccurrences: undefined,
							untilDate: undefined,
							updatedAt: "2024-01-01T00:00:00.000Z",
							recurrence: {
								startDate: "2024-02-01T00:00:00.000Z",
							},
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);

			expect(migratedData).toEqual({
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "One-time Payment",
							date: "2024-02-01T00:00:00.000Z",
							recurrenceType: "none",
							frequency: undefined,
							maxOccurrences: undefined,
							untilDate: undefined,
							updatedAt: "2024-01-01T00:00:00.000Z",
							createdAt: expect.any(String),
							recurrence: {
								startDate: "2024-02-01T00:00:00.000Z",
								v2Pattern: {
									type: "one-time",
									startDate: "2024-02-01T00:00:00.000Z",
								},
								isImmutable: true,
								migrationDate: expect.any(String),
								frequency: undefined,
								untilDate: undefined,
							},
						},
					],
					recurrenceModifications: [],
				},
			});
		});

		it("should migrate V1 scheduled item with infinite recurrence to V2 structure", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Monthly Subscription",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "infinite",
							frequency: "1mo",
							maxOccurrences: undefined,
							untilDate: undefined,
							updatedAt: "2024-01-01T00:00:00.000Z",
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
							},
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);

			expect(migratedData).toEqual({
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Monthly Subscription",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "infinite",
							frequency: "1mo",
							maxOccurrences: undefined,
							untilDate: undefined,
							updatedAt: "2024-01-01T00:00:00.000Z",
							createdAt: expect.any(String),
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
								v2Pattern: {
									type: "infinite",
									frequency: "1mo",
									startDate: "2024-01-01T00:00:00.000Z",
								},
								isImmutable: true,
								migrationDate: expect.any(String),
								frequency: {
									value: "1mo",
									type: "string",
								},
								untilDate: undefined,
							},
						},
					],
					recurrenceModifications: [],
				},
			});
		});

		it("should migrate V1 scheduled item with until-date recurrence to V2 structure", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Weekly Expense",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "until-date",
							frequency: "1w",
							maxOccurrences: undefined,
							untilDate: "2024-12-31T23:59:59.000Z",
							updatedAt: "2024-01-01T00:00:00.000Z",
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
							},
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);

			expect(migratedData).toEqual({
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Weekly Expense",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "until-date",
							frequency: "1w",
							maxOccurrences: undefined,
							untilDate: "2024-12-31T23:59:59.000Z",
							updatedAt: "2024-01-01T00:00:00.000Z",
							createdAt: expect.any(String),
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
								v2Pattern: {
									type: "until-date",
									frequency: "1w",
									startDate: "2024-01-01T00:00:00.000Z",
									endDate: "2024-12-31T23:59:59.000Z",
								},
								isImmutable: true,
								migrationDate: expect.any(String),
								frequency: {
									value: "1w",
									type: "string",
								},
								untilDate: undefined,
							},
						},
					],
					recurrenceModifications: [],
				},
			});
		});

		it("should migrate V1 scheduled item with n-occurrences recurrence to V2 structure", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Limited Payments",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "n-occurrences",
							frequency: "1mo",
							maxOccurrences: 12,
							untilDate: undefined,
							updatedAt: "2024-01-01T00:00:00.000Z",
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
							},
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);

			expect(migratedData).toEqual({
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Limited Payments",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "n-occurrences",
							frequency: "1mo",
							maxOccurrences: 12,
							untilDate: undefined,
							updatedAt: "2024-01-01T00:00:00.000Z",
							createdAt: expect.any(String),
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
								v2Pattern: {
									type: "n-occurrences",
									frequency: "1mo",
									startDate: "2024-01-01T00:00:00.000Z",
									maxOccurrences: 12,
								},
								isImmutable: true,
								migrationDate: expect.any(String),
								frequency: {
									value: "1mo",
									type: "string",
								},
								untilDate: undefined,
							},
						},
					],
					recurrenceModifications: [],
				},
			});
		});

		it("should handle migration of scheduled items without frequency", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "No Frequency Item",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "infinite",
							frequency: undefined,
							updatedAt: "2024-01-01T00:00:00.000Z",
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
							},
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);

			expect(migratedData).toEqual({
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "No Frequency Item",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "infinite",
							frequency: undefined,
							updatedAt: "2024-01-01T00:00:00.000Z",
							createdAt: expect.any(String),
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
								v2Pattern: {
									type: "infinite",
									frequency: "1mo",
									startDate: "2024-01-01T00:00:00.000Z",
								},
								isImmutable: true,
								migrationDate: expect.any(String),
								frequency: undefined,
								untilDate: undefined,
							},
						},
					],
					recurrenceModifications: [],
				},
			});
		});

		it("should initialize empty recurrenceModifications table during migration", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [],
					accounts: [{ id: "acc-1", name: "Test Account" }],
					categories: [{ id: "cat-1", name: "Test Category" }],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);

			expect(migratedData).toEqual({
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [],
					recurrenceModifications: [],
					accounts: [{ id: "acc-1", name: "Test Account" }],
					categories: [{ id: "cat-1", name: "Test Category" }],
				},
			});
		});

		it("should migrate multiple scheduled items with different recurrence types", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "One-time Payment",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "none",
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
							},
						},
						{
							id: "item-2",
							name: "Monthly Subscription",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "infinite",
							frequency: "1mo",
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
							},
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);

			expect(migratedData).toEqual({
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "One-time Payment",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "none",
							createdAt: expect.any(String),
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
								v2Pattern: {
									type: "one-time",
									startDate: "2024-01-01T00:00:00.000Z",
								},
								isImmutable: true,
								migrationDate: expect.any(String),
								frequency: undefined,
								untilDate: undefined,
							},
						},
						{
							id: "item-2",
							name: "Monthly Subscription",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "infinite",
							frequency: "1mo",
							createdAt: expect.any(String),
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
								v2Pattern: {
									type: "infinite",
									frequency: "1mo",
									startDate: "2024-01-01T00:00:00.000Z",
								},
								isImmutable: true,
								migrationDate: expect.any(String),
								frequency: {
									value: "1mo",
									type: "string",
								},
								untilDate: undefined,
							},
						},
					],
					recurrenceModifications: [],
				},
			});
		});

		it("should handle migration when no scheduled items exist", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [{ id: "tx-1", name: "Test Transaction" }],
					accounts: [{ id: "acc-1", name: "Test Account" }],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);

			expect(migratedData).toEqual({
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					recurrenceModifications: [],
					transactions: [{ id: "tx-1", name: "Test Transaction" }],
					accounts: [{ id: "acc-1", name: "Test Account" }],
				},
			});
		});

		it("should handle V2 migration for data already at version 1.3.0", async () => {
			const v2Data = {
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Already V2",
						},
					],
					recurrenceModifications: [],
				},
			};

			const migratedData = await dataVersioning.migrateData(v2Data);

			// Should return unchanged since it's already at the target version
			expect(migratedData).toEqual(v2Data);
		});

		it("should handle edge case with incomplete recurrence data", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Incomplete Item",
							date: "2024-01-01T00:00:00.000Z",
							// Missing recurrenceType and frequency
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
							},
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);

			expect(migratedData).toEqual({
				version: "1.3.0",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Incomplete Item",
							date: "2024-01-01T00:00:00.000Z",
							createdAt: expect.any(String),
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
								v2Pattern: {
									type: "one-time",
									startDate: "2024-01-01T00:00:00.000Z",
								},
								isImmutable: true,
								migrationDate: expect.any(String),
								frequency: undefined,
								untilDate: undefined,
							},
						},
					],
					recurrenceModifications: [],
				},
			});
		});
	});

	describe("Backward Compatibility", () => {
		it("should maintain V1 structure alongside V2 enhancements", async () => {
			const v1Data = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					scheduledItems: [
						{
							id: "item-1",
							name: "Legacy Item",
							date: "2024-01-01T00:00:00.000Z",
							recurrenceType: "infinite",
							frequency: "1w",
							maxOccurrences: undefined,
							untilDate: undefined,
							customField: "should be preserved",
							recurrence: {
								startDate: "2024-01-01T00:00:00.000Z",
							},
						},
					],
				},
			};

			const migratedData = await dataVersioning.migrateData(v1Data);
			const migratedItem = (migratedData as any).data.scheduledItems[0];

			// V1 fields should be preserved
			expect(migratedItem.id).toBe("item-1");
			expect(migratedItem.name).toBe("Legacy Item");
			expect(migratedItem.recurrenceType).toBe("infinite");
			expect(migratedItem.frequency).toBe("1w");
			expect(migratedItem.customField).toBe("should be preserved");

			// V2 enhancements should be added
			expect(migratedItem.recurrence.v2Pattern).toBeDefined();
			expect(migratedItem.recurrence.isImmutable).toBe(true);
			expect(migratedItem.recurrence.migrationDate).toBeDefined();
		});
	});

	describe("Error Handling", () => {
		it("should throw error for invalid data format", async () => {
			const invalidData = null;

			await expect(
				dataVersioning.migrateData(invalidData)
			).rejects.toThrow("Invalid data format for migration");
		});

		it("should throw error for missing data structure", async () => {
			const invalidData = {
				version: "1.2.6",
				// Missing timestamp and data
			};

			await expect(
				dataVersioning.migrateData(invalidData)
			).rejects.toThrow("Invalid data format for V2 migration");
		});
	});
});
