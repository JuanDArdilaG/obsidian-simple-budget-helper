import { CategoryID } from "contexts/Categories/domain";
import { Nanoid } from "contexts/Shared/domain";
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
		const mockAccountId1 = Nanoid.generate().value;
		const mockAccountId2 = Nanoid.generate().value;
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
			subCategoriesService as any,
		);

		await service.update(mockTransaction as any);

		expect(accountsService.getByID).toHaveBeenCalled();
		expect(transactionsRepository.persist).toHaveBeenCalledWith(
			mockTransaction,
		);
	});
});

describe("delete", () => {
	it("should delete transaction and adjust accounts", async () => {
		const mockAccountId1 = Nanoid.generate().value;
		const mockAccountId2 = Nanoid.generate().value;
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
			subCategoriesService as any,
		);

		await service.delete(mockTransaction.id as any);

		expect(accountsService.getByID).toHaveBeenCalled();
		expect(transactionsRepository.deleteById).toHaveBeenCalledWith(
			mockTransaction.id,
		);
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
			subCategoriesService as any,
		);

		await service.reassignTransactionsSubCategory(
			oldSubCategoryId,
			newSubCategoryId,
		);

		// Verify that the subcategory service was called to get the new subcategory
		expect(subCategoriesService.getByID).toHaveBeenCalledWith(
			newSubCategoryId,
		);

		// Verify that both update methods were called on the transaction
		expect(mockTransaction.updateSubCategory).toHaveBeenCalledWith(
			newSubCategoryId,
		);
		expect(mockTransaction.updateCategory).toHaveBeenCalledWith(
			newCategoryId,
		);

		// Verify that the transaction was persisted
		expect(transactionsRepository.persist).toHaveBeenCalledWith(
			mockTransaction,
		);
	});
});
