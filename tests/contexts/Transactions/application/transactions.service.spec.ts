import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { TransactionID } from "contexts/Transactions/domain";
import { describe, expect, it, vi } from "vitest";

const generateMockTransaction = () => {
	return {
		id: { value: TransactionID.generate().value },
		name: { toString: () => "Mock Transaction" },
		updateName: vi.fn(),
		operation: { isIncome: () => true, value: "income" as const },
		originAmount: { value: 100 },
		date: { value: new Date("2024-01-01") },
		originAccounts: [{ accountId: { value: "mock-account-id" } }],
		destinationAccounts: [] as any[],
	};
};

describe("update", () => {
	it("should update transaction and adjust accounts", async () => {
		const mockAccountId1 = AccountID.generate().value;
		const mockAccountId2 = AccountID.generate().value;
		const mockTransaction = generateMockTransaction();
		mockTransaction.originAccounts = [
			{ accountId: { value: mockAccountId1 } },
		];
		mockTransaction.destinationAccounts = [
			{ accountId: { value: mockAccountId2 } },
		];
		const accountsService = {
			getByID: vi.fn().mockResolvedValue({
				adjustOnTransactionUpdate: vi.fn(),
				adjustOnTransactionDeletion: vi.fn(),
			}),
			update: vi.fn(),
		};
		const transactionsRepository = {
			findById: vi.fn().mockResolvedValue(mockTransaction),
			persist: vi.fn(),
		};
		const categoriesService = {};
		const subCategoriesService = {};

		const service = new TransactionsService(
			accountsService as any,
			transactionsRepository as any,
			categoriesService as any,
			subCategoriesService as any
		);

		await service.update(mockTransaction as any);

		expect(accountsService.getByID).toHaveBeenCalled();
		expect(transactionsRepository.persist).toHaveBeenCalledWith(
			mockTransaction
		);
	});
});

describe("delete", () => {
	it("should delete transaction and adjust accounts", async () => {
		const mockAccountId1 = AccountID.generate().value;
		const mockAccountId2 = AccountID.generate().value;
		const mockTransaction = generateMockTransaction();
		mockTransaction.originAccounts = [
			{ accountId: { value: mockAccountId1 } },
		];
		mockTransaction.destinationAccounts = [
			{ accountId: { value: mockAccountId2 } },
		];
		const accountsService = {
			getByID: vi.fn().mockResolvedValue({
				adjustOnTransactionDeletion: vi.fn(),
				adjustOnTransactionUpdate: vi.fn(),
			}),
			update: vi.fn(),
		};
		const transactionsRepository = {
			findById: vi.fn().mockResolvedValue(mockTransaction),
			deleteById: vi.fn(),
		};
		const categoriesService = {};
		const subCategoriesService = {};

		const service = new TransactionsService(
			accountsService as any,
			transactionsRepository as any,
			categoriesService as any,
			subCategoriesService as any
		);

		await service.delete(mockTransaction.id as any);

		expect(accountsService.getByID).toHaveBeenCalled();
		expect(transactionsRepository.deleteById).toHaveBeenCalledWith(
			mockTransaction.id
		);
	});
});

describe("TransactionsService extra methods", () => {
	it("should get transaction summaries by category", async () => {
		const mockTransaction = generateMockTransaction();

		const service = new TransactionsService(
			{} as any,
			{
				findByCriteria: vi.fn().mockResolvedValue([mockTransaction]),
			} as any,
			{} as any,
			{} as any
		);

		const categoryId = CategoryID.generate();
		const summaries = await service.getTransactionSummariesByCategory(
			categoryId
		);

		expect(summaries).toBeDefined();
		expect(Array.isArray(summaries)).toBe(true);
		expect(summaries.length).toBe(1);
	});

	it("should get transaction summaries by subcategory", async () => {
		const mockTransaction = generateMockTransaction();

		const service = new TransactionsService(
			{} as any,
			{
				findByCriteria: vi.fn().mockResolvedValue([mockTransaction]),
			} as any,
			{} as any,
			{} as any
		);

		const subCategoryId = SubCategoryID.generate();
		const summaries = await service.getTransactionSummariesBySubCategory(
			subCategoryId
		);

		expect(summaries).toBeDefined();
		expect(Array.isArray(summaries)).toBe(true);
		expect(summaries.length).toBe(1);
	});

	it("should return correct transaction summary structure", async () => {
		const mockTransaction = generateMockTransaction();

		const service = new TransactionsService(
			{} as any,
			{
				findByCriteria: vi.fn().mockResolvedValue([mockTransaction]),
			} as any,
			{} as any,
			{} as any
		);

		const categoryId = CategoryID.generate();
		const summaries = await service.getTransactionSummariesByCategory(
			categoryId
		);

		if (summaries.length > 0) {
			const summary = summaries[0];
			expect(summary).toHaveProperty("id");
			expect(summary).toHaveProperty("name");
			expect(summary).toHaveProperty("amount");
			expect(summary).toHaveProperty("date");
			expect(summary).toHaveProperty("operation");
			expect(["income", "expense", "transfer"]).toContain(
				summary.operation
			);
		}
	});
});

describe("reassignTransactionsSubCategory", () => {
	it("should update both subcategory and category when reassigning transactions", async () => {
		const oldSubCategoryId = SubCategoryID.generate();
		const newSubCategoryId = SubCategoryID.generate();
		const newCategoryId = CategoryID.generate();

		// Mock transaction with update methods
		const mockTransaction = {
			updateSubCategory: vi.fn(),
			updateCategory: vi.fn(),
		};

		// Mock subcategory service to return a subcategory with parent category
		const subCategoriesService = {
			getByID: vi.fn().mockResolvedValue({
				category: newCategoryId,
			}),
		};

		// Mock transactions repository
		const transactionsRepository = {
			findByCriteria: vi.fn().mockResolvedValue([mockTransaction]),
			persist: vi.fn(),
		};

		const service = new TransactionsService(
			{} as any,
			transactionsRepository as any,
			{} as any,
			subCategoriesService as any
		);

		await service.reassignTransactionsSubCategory(
			oldSubCategoryId,
			newSubCategoryId
		);

		// Verify that the subcategory service was called to get the new subcategory
		expect(subCategoriesService.getByID).toHaveBeenCalledWith(
			newSubCategoryId
		);

		// Verify that both update methods were called on the transaction
		expect(mockTransaction.updateSubCategory).toHaveBeenCalledWith(
			newSubCategoryId
		);
		expect(mockTransaction.updateCategory).toHaveBeenCalledWith(
			newCategoryId
		);

		// Verify that the transaction was persisted
		expect(transactionsRepository.persist).toHaveBeenCalledWith(
			mockTransaction
		);
	});
});
