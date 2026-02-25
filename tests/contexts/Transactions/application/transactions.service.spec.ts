import { Category, CategoryName } from "contexts/Categories/domain";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { describe, expect, it, vi } from "vitest";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { buildTestTransactions } from "../../Reports/domain/buildTestTransactions";

describe("update", () => {
	it("should update transaction and adjust accounts", async () => {
		const accounts = buildTestAccounts(2);
		const mockTransaction = buildTestTransactions([
			{
				account: accounts[0],
				toAccount: accounts[1],
			},
		])[0];
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
		const accounts = buildTestAccounts(2);
		const mockTransaction = buildTestTransactions([
			{
				account: accounts[0],
				toAccount: accounts[1],
			},
		])[0];
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

		await service.delete(mockTransaction.nanoid);

		expect(accountsService.getByID).toHaveBeenCalled();
		expect(transactionsRepository.deleteById).toHaveBeenCalledWith(
			mockTransaction.id,
		);
	});
});

describe("reassignTransactionsSubCategory", () => {
	it("should update both subcategory and category when reassigning transactions", async () => {
		const oldSubCategoryId = Nanoid.generate();
		const newSubCategoryId = Nanoid.generate();
		const newCategoryId = Nanoid.generate();

		// Mock transaction with update methods
		const mockTransaction = {
			updateSubCategory: vi.fn(),
			updateCategory: vi.fn(),
		};

		const categoriesService = {
			getByID: vi
				.fn()
				.mockResolvedValue(
					Category.create(new CategoryName("New Category")),
				),
		};

		// Mock subcategory service to return a subcategory with parent category
		const subCategoriesService = {
			getByID: vi.fn().mockResolvedValue({
				categoryId: newCategoryId,
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
			categoriesService as any,
			subCategoriesService as any,
		);

		await service.reassignTransactionsSubCategory(
			oldSubCategoryId,
			newSubCategoryId,
		);

		// Verify that the subcategory service was called to get the new subcategory
		expect(subCategoriesService.getByID).toHaveBeenCalled();

		// Verify that both update methods were called on the transaction
		expect(mockTransaction.updateSubCategory).toHaveBeenCalled();
		expect(mockTransaction.updateCategory).toHaveBeenCalled();

		// Verify that the transaction was persisted
		expect(transactionsRepository.persist).toHaveBeenCalledWith(
			mockTransaction,
		);
	});
});
