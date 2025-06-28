import { AccountsService } from "contexts/Accounts/application/accounts.service";
import { AccountID } from "contexts/Accounts/domain";
import { InvalidArgumentError } from "contexts/Shared/domain/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionsRepositoryMock } from "../../Transactions/domain/transactions-repository.mock";
import { AccountsRepositoryMock } from "../domain/accounts-repository.mock";

describe("AccountsService", () => {
	let accountsService: AccountsService;
	let accountsRepository: AccountsRepositoryMock;
	let transactionsRepository: TransactionsRepositoryMock;

	beforeEach(() => {
		accountsRepository = new AccountsRepositoryMock([]);
		transactionsRepository = new TransactionsRepositoryMock([]);
		accountsService = new AccountsService(
			accountsRepository,
			transactionsRepository
		);
	});

	describe("delete", () => {
		it("should delete account when it has no transactions", async () => {
			// Arrange
			const accountId = AccountID.generate();

			// Mock the repositories
			vi.spyOn(
				transactionsRepository,
				"hasTransactionsForAccount"
			).mockResolvedValue(false);
			vi.spyOn(accountsRepository, "deleteById").mockResolvedValue(true);

			// Act
			await accountsService.delete(accountId);

			// Assert
			expect(
				transactionsRepository.hasTransactionsForAccount
			).toHaveBeenCalledWith(accountId);
			expect(accountsRepository.deleteById).toHaveBeenCalledWith(
				accountId
			);
		});

		it("should throw error when account has transactions", async () => {
			// Arrange
			const accountId = AccountID.generate();
			// Mock the repositories
			vi.spyOn(
				transactionsRepository,
				"hasTransactionsForAccount"
			).mockResolvedValue(true);
			vi.spyOn(accountsRepository, "deleteById").mockResolvedValue(true);

			// Act & Assert
			await expect(accountsService.delete(accountId)).rejects.toThrow(
				InvalidArgumentError
			);
			expect(
				transactionsRepository.hasTransactionsForAccount
			).toHaveBeenCalledWith(accountId);
			expect(accountsRepository.deleteById).not.toHaveBeenCalled();
		});
	});
});
