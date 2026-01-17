import { PriceValueObject } from "@juandardilag/value-objects";
import { AccountsIntegrityService } from "contexts/Accounts/application/accounts-integrity.service";
import {
	Account,
	AccountID,
	AccountIntegrityResult,
} from "contexts/Accounts/domain";
import { Transaction, TransactionID } from "contexts/Transactions/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestAccounts } from "../domain/buildTestAccounts";

// Mock repositories
const mockAccountsRepository = {
	findById: vi.fn(),
	findAll: vi.fn(),
	findByCriteria: vi.fn(),
	persist: vi.fn(),
	deleteById: vi.fn(),
	exists: vi.fn(),
	findByName: vi.fn(),
} as const;

const mockTransactionsRepository = {
	findById: vi.fn(),
	findAll: vi.fn(),
	findByCriteria: vi.fn(),
	persist: vi.fn(),
	deleteById: vi.fn(),
	exists: vi.fn(),
	findAllUniqueItemBrands: vi.fn(),
	findAllUniqueItemStores: vi.fn(),
	hasTransactionsForAccount: vi.fn(),
	findByAccountId: vi.fn(),
} as const;

const currency = "USD";

// Mock transaction that behaves like a real transaction
const createMockTransaction = (testAccountId: AccountID, amount: number) => {
	const mockTransaction = {
		id: { value: TransactionID.generate().value },
		getRealAmountForAccount: vi
			.fn()
			.mockReturnValue({ value: new PriceValueObject(amount) }),
	} as unknown as Transaction;

	return mockTransaction;
};

describe("AccountsIntegrityService", () => {
	let service: AccountsIntegrityService;
	let mockAccount: Account;
	let testAccountId: AccountID;

	beforeEach(() => {
		vi.clearAllMocks();
		service = new AccountsIntegrityService(
			mockAccountsRepository as any,
			mockTransactionsRepository as any
		);

		// Create a proper AccountID
		testAccountId = AccountID.generate();

		// Create a mock account
		mockAccount = Account.fromPrimitives({
			id: testAccountId.value,
			type: "asset",
			name: "Test Account",
			currency,
			balance: 100,
			updatedAt: new Date().toISOString(),
		});
	});

	describe("calculateAccountIntegrity", () => {
		it("should calculate integrity for an account with no discrepancy", async () => {
			// Arrange
			const transactions = [
				createMockTransaction(testAccountId, 50),
				createMockTransaction(testAccountId, 25),
				createMockTransaction(testAccountId, 25),
			];

			mockAccountsRepository.findById.mockResolvedValue(mockAccount);
			mockTransactionsRepository.findByAccountId.mockResolvedValue(
				transactions
			);

			// Act
			const result = await service.calculateAccountIntegrity(
				testAccountId
			);

			// Assert
			expect(result).toBeInstanceOf(AccountIntegrityResult);
			expect(result.accountId).toBe(testAccountId);
			expect(result.hasIntegrity).toBe(true);
			expect(mockAccountsRepository.findById).toHaveBeenCalledWith(
				testAccountId
			);
			expect(
				mockTransactionsRepository.findByAccountId
			).toHaveBeenCalledWith(testAccountId);
		});

		it("should calculate integrity for an account with discrepancy", async () => {
			// Arrange
			const transactions = [
				createMockTransaction(testAccountId, 75), // Expected balance should be 75, but account shows 100
			];

			mockAccountsRepository.findById.mockResolvedValue(mockAccount);
			mockTransactionsRepository.findByAccountId.mockResolvedValue(
				transactions
			);

			// Act
			const result = await service.calculateAccountIntegrity(
				testAccountId
			);

			// Assert
			expect(result.hasIntegrity).toBe(false);
			expect(result.hasDiscrepancy).toBe(true);
			expect(result.discrepancy.equalTo(new PriceValueObject(25))).toBe(
				true
			); // 100 - 75 = 25
		});

		it("should throw error when account is not found", async () => {
			// Arrange
			const nonExistentAccountId = AccountID.generate();
			mockAccountsRepository.findById.mockResolvedValue(null);

			// Act & Assert
			await expect(
				service.calculateAccountIntegrity(nonExistentAccountId)
			).rejects.toThrow(
				`Account with ID ${nonExistentAccountId.value} not found`
			);
		});

		it("should handle accounts with no transactions", async () => {
			// Arrange

			mockAccountsRepository.findById.mockResolvedValue(mockAccount);
			mockTransactionsRepository.findByAccountId.mockResolvedValue([]);

			// Act
			const result = await service.calculateAccountIntegrity(
				testAccountId
			);

			// Assert
			expect(
				result.expectedBalance.equalTo(new PriceValueObject(0))
			).toBe(true);
			expect(
				result.actualBalance.equalTo(new PriceValueObject(100))
			).toBe(true);
			expect(result.hasDiscrepancy).toBe(true);
		});
	});

	describe("calculateAllAccountsIntegrity", () => {
		it("should calculate integrity for all accounts", async () => {
			// Arrange
			const accounts = buildTestAccounts(2);

			mockAccountsRepository.findAll.mockResolvedValue(accounts);
			mockAccountsRepository.findById
				.mockResolvedValueOnce(accounts[0])
				.mockResolvedValueOnce(accounts[1]);
			mockTransactionsRepository.findByAccountId
				.mockResolvedValueOnce([
					createMockTransaction(accounts[0].id, 100),
				])
				.mockResolvedValueOnce([
					createMockTransaction(accounts[1].id, 200),
				]);

			// Act
			const report = await service.calculateAllAccountsIntegrity();

			// Assert
			expect(report.totalAccountsChecked).toBe(2);
			expect(report.hasDiscrepancies).toBe(true);
			expect(mockAccountsRepository.findAll).toHaveBeenCalledTimes(1);
			expect(
				mockTransactionsRepository.findByAccountId
			).toHaveBeenCalledTimes(2);
		});

		it("should continue processing other accounts when one fails", async () => {
			// Arrange
			const accounts = buildTestAccounts(2);

			mockAccountsRepository.findAll.mockResolvedValue(accounts);
			mockAccountsRepository.findById
				.mockResolvedValueOnce(accounts[0])
				.mockResolvedValueOnce(accounts[1]);
			mockTransactionsRepository.findByAccountId
				.mockRejectedValueOnce(new Error("Database error"))
				.mockResolvedValueOnce([
					createMockTransaction(accounts[1].id, 200),
				]);

			// Act
			const report = await service.calculateAllAccountsIntegrity();

			// Assert
			expect(report.totalAccountsChecked).toBe(1); // Only account2 succeeded
			// expect(report.hasDiscrepancies).toBe(false);
		});
	});

	describe("resolveDiscrepancy", () => {
		it("should resolve discrepancy by updating account balance", async () => {
			// Arrange

			const transactions = [createMockTransaction(testAccountId, 75)];

			mockAccountsRepository.findById.mockResolvedValue(mockAccount);
			mockTransactionsRepository.findByAccountId.mockResolvedValue(
				transactions
			);
			mockAccountsRepository.persist.mockResolvedValue(undefined);

			// Act
			const success = await service.resolveDiscrepancy(testAccountId);

			// Assert
			expect(success).toBe(true);
			expect(mockAccountsRepository.persist).toHaveBeenCalledTimes(1);

			const persistedAccount = mockAccountsRepository.persist.mock
				.calls[0][0] as Account;
			expect(
				persistedAccount.balance.value.equalTo(new PriceValueObject(75))
			).toBe(true);
		});

		it("should return true for accounts with no discrepancy", async () => {
			// Arrange

			const transactions = [createMockTransaction(testAccountId, 100)];

			mockAccountsRepository.findById.mockResolvedValue(mockAccount);
			mockTransactionsRepository.findByAccountId.mockResolvedValue(
				transactions
			);

			// Act
			const success = await service.resolveDiscrepancy(testAccountId);

			// Assert
			expect(success).toBe(true);
			expect(mockAccountsRepository.persist).not.toHaveBeenCalled();
		});

		it("should return false when persistence fails", async () => {
			// Arrange

			const transactions = [createMockTransaction(testAccountId, 75)];

			mockAccountsRepository.findById.mockResolvedValue(mockAccount);
			mockTransactionsRepository.findByAccountId.mockResolvedValue(
				transactions
			);
			mockAccountsRepository.persist.mockRejectedValue(
				new Error("Persistence error")
			);

			// Act
			const success = await service.resolveDiscrepancy(testAccountId);

			// Assert
			expect(success).toBe(false);
		});

		it("should return false when account is not found", async () => {
			// Arrange
			const nonExistentAccountId = AccountID.generate();
			mockAccountsRepository.findById.mockResolvedValue(null);

			// Act
			const success = await service.resolveDiscrepancy(
				nonExistentAccountId
			);

			// Assert
			expect(success).toBe(false);
		});
	});
});
