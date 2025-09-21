import {
	Conflict,
	ConflictResolver,
} from "contexts/Shared/infrastructure/persistence/local/conflict-resolver";
import { LocalData } from "contexts/Shared/infrastructure/persistence/local/local-file-manager";
import { beforeEach, describe, expect, it } from "vitest";

describe("ConflictResolver", () => {
	let conflictResolver: ConflictResolver;

	beforeEach(() => {
		conflictResolver = new ConflictResolver();
	});

	describe("Local File Data Priority", () => {
		it("should prioritize local file data over IndexedDB data for modifications", async () => {
			const localData: LocalData = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "transaction-1",
							name: "Local Transaction",
							amount: 100,
							updatedAt: "2024-01-02T00:00:00.000Z",
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

			const conflicts: Conflict[] = [
				{
					tableName: "transactions",
					recordId: "transaction-1",
					type: "modification",
					indexedDBData: {
						id: "transaction-1",
						name: "IndexedDB Transaction",
						amount: 200,
						updatedAt: "2024-01-03T00:00:00.000Z",
					},
					localData: {
						id: "transaction-1",
						name: "Local Transaction",
						amount: 100,
						updatedAt: "2024-01-02T00:00:00.000Z",
					},
					timestamp: "2024-01-03T00:00:00.000Z",
				},
			];

			const resolvedData = await conflictResolver.resolveConflicts(
				conflicts,
				localData
			);

			// Verify that local file data is preserved
			expect(resolvedData.data.transactions).toHaveLength(1);
			expect(resolvedData.data.transactions[0]).toEqual({
				id: "transaction-1",
				name: "Local Transaction",
				amount: 100,
				updatedAt: "2024-01-02T00:00:00.000Z",
			});
		});

		it("should prioritize local file data over IndexedDB data for creations when local data exists", async () => {
			const localData: LocalData = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [
						{
							id: "transaction-1",
							name: "Local Transaction",
							amount: 100,
							updatedAt: "2024-01-02T00:00:00.000Z",
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

			const conflicts: Conflict[] = [
				{
					tableName: "transactions",
					recordId: "transaction-1",
					type: "creation",
					indexedDBData: {
						id: "transaction-1",
						name: "IndexedDB Transaction",
						amount: 200,
						updatedAt: "2024-01-03T00:00:00.000Z",
					},
					localData: {
						id: "transaction-1",
						name: "Local Transaction",
						amount: 100,
						updatedAt: "2024-01-02T00:00:00.000Z",
					},
					timestamp: "2024-01-03T00:00:00.000Z",
				},
			];

			const resolvedData = await conflictResolver.resolveConflicts(
				conflicts,
				localData
			);

			// Verify that local file data is preserved
			expect(resolvedData.data.transactions).toHaveLength(1);
			expect(resolvedData.data.transactions[0]).toEqual({
				id: "transaction-1",
				name: "Local Transaction",
				amount: 100,
				updatedAt: "2024-01-02T00:00:00.000Z",
			});
		});

		it("should keep IndexedDB data for creations when no local data exists", async () => {
			const localData: LocalData = {
				version: "1.2.6",
				timestamp: "2024-01-01T00:00:00.000Z",
				data: {
					transactions: [],
					accounts: [],
					brands: [],
					categories: [],
					items: [],
					providers: [],
					stores: [],
					subcategories: [],
				},
			};

			const conflicts: Conflict[] = [
				{
					tableName: "transactions",
					recordId: "transaction-1",
					type: "creation",
					indexedDBData: {
						id: "transaction-1",
						name: "IndexedDB Transaction",
						amount: 200,
						updatedAt: "2024-01-03T00:00:00.000Z",
					},
					localData: null,
					timestamp: "2024-01-03T00:00:00.000Z",
				},
			];

			const resolvedData = await conflictResolver.resolveConflicts(
				conflicts,
				localData
			);

			// Verify that IndexedDB data is kept when no local data exists
			expect(resolvedData.data.transactions).toHaveLength(1);
			expect(resolvedData.data.transactions[0]).toEqual({
				id: "transaction-1",
				name: "IndexedDB Transaction",
				amount: 200,
				updatedAt: "2024-01-03T00:00:00.000Z",
			});
		});
	});
});
