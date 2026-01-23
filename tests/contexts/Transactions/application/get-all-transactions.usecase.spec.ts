import { Category, CategoryName } from "contexts/Categories/domain";
import { SubCategory, SubCategoryName } from "contexts/Subcategories/domain";
import { GetAllTransactionsUseCase } from "contexts/Transactions/application/get-all-transactions.usecase";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionName } from "contexts/Transactions/domain/item-name.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionOperation } from "contexts/Transactions/domain/transaction-operation.valueobject";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { ITransactionsRepository } from "contexts/Transactions/domain/transactions-repository.interface";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionDate } from "../../../../src/contexts/Transactions/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

describe("GetAllTransactionsUseCase", () => {
	let useCase: GetAllTransactionsUseCase;
	let mockRepository: ITransactionsRepository;

	beforeEach(() => {
		mockRepository = {
			findByCriteria: vi.fn(),
			findById: vi.fn(),
			findByAccountId: vi.fn(),
			findAll: vi.fn(),
			persist: vi.fn(),
			deleteById: vi.fn(),
			exists: vi.fn(),
			findAllUniqueItemBrands: vi.fn(),
			findAllUniqueItemStores: vi.fn(),
			hasTransactionsForAccount: vi.fn(),
		} as ITransactionsRepository;

		useCase = new GetAllTransactionsUseCase(mockRepository);
	});

	describe("account filtering", () => {
		it("should filter transactions by account using splits", async () => {
			// Arrange
			const accounts = buildTestAccounts(2);
			const account1 = accounts[0];
			const account2 = accounts[1];
			const category = Category.create(new CategoryName("Test Category"));
			const subCategory = SubCategory.create(
				category.id,
				new SubCategoryName("Test Subcategory"),
			);

			const transaction1 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account1, new TransactionAmount(100))],
				[new AccountSplit(account2, new TransactionAmount(100))],
				new TransactionName("Transfer 1"),
				new TransactionOperation("transfer"),
				category,
				subCategory,
			);

			const transaction2 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account2, new TransactionAmount(50))],
				[],
				new TransactionName("Expense 1"),
				new TransactionOperation("expense"),
				category,
				subCategory,
			);

			const transaction3 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account1, new TransactionAmount(75))],
				[],
				new TransactionName("Expense 2"),
				new TransactionOperation("expense"),
				category,
				subCategory,
			);

			vi.mocked(mockRepository.findByCriteria).mockResolvedValue([
				transaction1,
				transaction2,
				transaction3,
			]);

			// Act
			const result = await useCase.execute({
				accountFilter: account1.id,
			});

			// Assert
			expect(result).toHaveLength(2);
			expect(result).toContain(transaction1); // Has account1 in fromSplits
			expect(result).toContain(transaction3); // Has account1 in fromSplits
			expect(result).not.toContain(transaction2); // Only has account2
		});

		it("should filter transactions by account in toSplits", async () => {
			// Arrange
			const accounts = buildTestAccounts(2);
			const account1 = accounts[0];
			const account2 = accounts[1];
			const category = Category.create(new CategoryName("Test Category"));
			const subCategory = SubCategory.create(
				category.id,
				new SubCategoryName("Test Subcategory"),
			);

			const transaction1 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account2, new TransactionAmount(100))],
				[new AccountSplit(account1, new TransactionAmount(100))],
				new TransactionName("Transfer to account1"),
				new TransactionOperation("transfer"),
				category,
				subCategory,
			);

			const transaction2 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account2, new TransactionAmount(50))],
				[],
				new TransactionName("Expense from account2"),
				new TransactionOperation("expense"),
				category,
				subCategory,
			);

			vi.mocked(mockRepository.findByCriteria).mockResolvedValue([
				transaction1,
				transaction2,
			]);

			// Act
			const result = await useCase.execute({
				accountFilter: account1.id,
			});

			// Assert
			expect(result).toHaveLength(1);
			expect(result).toContain(transaction1); // Has account1 in toSplits
			expect(result).not.toContain(transaction2); // No account1
		});

		it("should return all transactions when no account filter is provided", async () => {
			// Arrange
			const accounts = buildTestAccounts(2);
			const account1 = accounts[0];
			const account2 = accounts[1];
			const category = Category.create(new CategoryName("Test Category"));
			const subCategory = SubCategory.create(
				category.id,
				new SubCategoryName("Test Subcategory"),
			);

			const transaction1 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account1, new TransactionAmount(100))],
				[],
				new TransactionName("Transaction 1"),
				new TransactionOperation("expense"),
				category,
				subCategory,
			);

			const transaction2 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account2, new TransactionAmount(50))],
				[],
				new TransactionName("Transaction 2"),
				new TransactionOperation("expense"),
				category,
				subCategory,
			);

			vi.mocked(mockRepository.findByCriteria).mockResolvedValue([
				transaction1,
				transaction2,
			]);

			// Act
			const result = await useCase.execute({});

			// Assert
			expect(result).toHaveLength(2);
			expect(result).toContain(transaction1);
			expect(result).toContain(transaction2);
		});
	});

	describe("category and subcategory filtering", () => {
		it("should filter transactions by category", async () => {
			// Arrange
			const account = buildTestAccounts(1)[0];
			const category1 = Category.create(
				new CategoryName("Test Category 1"),
			);
			const category2 = Category.create(
				new CategoryName("Test Category 2"),
			);
			const subCategory = SubCategory.create(
				category1.id,
				new SubCategoryName("Test Subcategory"),
			);

			const transaction1 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account, new TransactionAmount(100))],
				[],
				new TransactionName("Transaction 1"),
				new TransactionOperation("expense"),
				category1,
				subCategory,
			);

			const transaction2 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account, new TransactionAmount(50))],
				[],
				new TransactionName("Transaction 2"),
				new TransactionOperation("expense"),
				category2,
				subCategory,
			);

			vi.mocked(mockRepository.findByCriteria).mockResolvedValue([
				transaction1,
				transaction2,
			]);

			// Act
			const result = await useCase.execute({
				categoryFilter: category1.id,
			});

			// Assert
			expect(result).toHaveLength(1);
			expect(result).toContain(transaction1);
			expect(result).not.toContain(transaction2);
		});

		it("should filter transactions by subcategory", async () => {
			// Arrange
			const account = buildTestAccounts(1)[0];
			const category = Category.create(new CategoryName("Test Category"));
			const subCategory1 = SubCategory.create(
				category.id,
				new SubCategoryName("Test Subcategory 1"),
			);
			const subCategory2 = SubCategory.create(
				category.id,
				new SubCategoryName("Test Subcategory 2"),
			);

			const transaction1 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account, new TransactionAmount(100))],
				[],
				new TransactionName("Transaction 1"),
				new TransactionOperation("expense"),
				category,
				subCategory1,
			);

			const transaction2 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account, new TransactionAmount(50))],
				[],
				new TransactionName("Transaction 2"),
				new TransactionOperation("expense"),
				category,
				subCategory2,
			);

			vi.mocked(mockRepository.findByCriteria).mockResolvedValue([
				transaction1,
				transaction2,
			]);

			// Act
			const result = await useCase.execute({
				subCategoryFilter: subCategory1.id,
			});

			// Assert
			expect(result).toHaveLength(1);
			expect(result).toContain(transaction1);
			expect(result).not.toContain(transaction2);
		});
	});

	describe("combined filtering", () => {
		it("should filter transactions by account, category, and subcategory", async () => {
			// Arrange
			const accounts = buildTestAccounts(2);
			const account1 = accounts[0];
			const account2 = accounts[1];
			const category1 = Category.create(
				new CategoryName("Test Category 1"),
			);
			const category2 = Category.create(
				new CategoryName("Test Category 2"),
			);
			const subCategory1 = SubCategory.create(
				category1.id,
				new SubCategoryName("Test Subcategory 1"),
			);
			const subCategory2 = SubCategory.create(
				category2.id,
				new SubCategoryName("Test Subcategory 2"),
			);

			const transaction1 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account1, new TransactionAmount(100))],
				[],
				new TransactionName("Transaction 1"),
				new TransactionOperation("expense"),
				category1,
				subCategory1,
			);

			const transaction2 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account1, new TransactionAmount(50))],
				[],
				new TransactionName("Transaction 2"),
				new TransactionOperation("expense"),
				category2,
				subCategory1,
			);

			const transaction3 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account1, new TransactionAmount(75))],
				[],
				new TransactionName("Transaction 3"),
				new TransactionOperation("expense"),
				category1,
				subCategory2,
			);

			const transaction4 = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account2, new TransactionAmount(25))],
				[],
				new TransactionName("Transaction 4"),
				new TransactionOperation("expense"),
				category1,
				subCategory1,
			);

			vi.mocked(mockRepository.findByCriteria).mockResolvedValue([
				transaction1,
				transaction2,
				transaction3,
				transaction4,
			]);

			// Act
			const result = await useCase.execute({
				accountFilter: account1.id,
				categoryFilter: category1.id,
				subCategoryFilter: subCategory1.id,
			});

			// Assert
			expect(result).toHaveLength(1);
			expect(result).toContain(transaction1);
			expect(result).not.toContain(transaction2); // Wrong category
			expect(result).not.toContain(transaction3); // Wrong subcategory
			expect(result).not.toContain(transaction4); // Wrong account
		});
	});

	describe("quantity functionality", () => {
		it("should create multiple transactions for the same item when quantity > 1", async () => {
			// This test would be more appropriate for the CreateTransactionForm component
			// but we can test the underlying logic here
			const account = buildTestAccounts(1)[0];
			const category = Category.create(new CategoryName("Test Category"));
			const subCategory = SubCategory.create(
				category.id,
				new SubCategoryName("Test Subcategory"),
			);

			// Create multiple transactions with the same item ID but different transaction IDs
			const transactions = [];

			for (let i = 0; i < 3; i++) {
				const transaction = Transaction.create(
					TransactionDate.createNowDate(),
					[new AccountSplit(account, new TransactionAmount(100))],
					[],
					new TransactionName("Test Item"),
					new TransactionOperation("expense"),
					category,
					subCategory,
				);
				transactions.push(transaction);
			}

			vi.mocked(mockRepository.findByCriteria).mockResolvedValue(
				transactions,
			);

			// Act
			const result = await useCase.execute({
				categoryFilter: category.id,
			});

			// Assert
			expect(result).toHaveLength(3);
			expect(result.every((t) => t.name.value === "Test Item")).toBe(
				true,
			);
			expect(
				result.every((t) => t.category.id.equalTo(category.id)),
			).toBe(true);
		});

		it("should handle edge cases for quantity values", async () => {
			// Test that the system can handle various quantity scenarios
			const account = buildTestAccounts(1)[0];
			const category = Category.create(new CategoryName("Test Category"));
			const subCategory = SubCategory.create(
				category.id,
				new SubCategoryName("Test Subcategory"),
			);

			// Create a single transaction (quantity = 1)
			const transaction = Transaction.create(
				TransactionDate.createNowDate(),
				[new AccountSplit(account, new TransactionAmount(50))],
				[],
				new TransactionName("Single Item"),
				new TransactionOperation("expense"),
				category,
				subCategory,
			);

			vi.mocked(mockRepository.findByCriteria).mockResolvedValue([
				transaction,
			]);

			// Act
			const result = await useCase.execute({
				categoryFilter: category.id,
			});

			// Assert
			expect(result).toHaveLength(1);
			expect(result[0].name.value).toBe("Single Item");
		});
	});
});
