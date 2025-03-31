import { describe, expect, it } from "vitest";
import { buildTestTransactions } from "../../Reports/domain/buildTestTransactions";
import { AccountsServiceMock } from "../../Accounts/application/accounts-service.mock";
import {
	Account,
	AccountID,
	AccountType,
	AccountName,
	AccountBalance,
} from "contexts/Accounts/domain";
import { CategoriesService } from "contexts/Categories/application/categories.service";
import { SubCategoriesService } from "contexts/Subcategories/application/subcategories.service";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { Transaction } from "contexts/Transactions/domain";
import { TransactionsRepositoryMock } from "../domain/transactions-repository.mock";

describe("update", () => {
	it("should update from account for transfer transaction", async () => {
		const accounts = [
			new Account(
				AccountID.generate(),
				AccountType.asset(),
				new AccountName("test"),
				AccountBalance.zero()
			),
			new Account(
				AccountID.generate(),
				AccountType.asset(),
				new AccountName("test2"),
				AccountBalance.zero()
			),
			new Account(
				AccountID.generate(),
				AccountType.asset(),
				new AccountName("test3"),
				AccountBalance.zero()
			),
		];
		const transactions = buildTestTransactions([
			{
				operation: "transfer",
				account: accounts[0].id.value,
				toAccount: accounts[2].id.value,
				amount: 10,
			},
			{},
			{},
			{},
		]);
		const transactionsRepository = new TransactionsRepositoryMock(
			transactions
		);
		const accountsService = new AccountsServiceMock(accounts);
		const transactionsService = new TransactionsService(
			accountsService,
			transactionsRepository,
			{} as CategoriesService,
			{} as SubCategoriesService
		);

		const updatedTransaction = Transaction.fromPrimitives(
			transactions[0].toPrimitives()
		);
		updatedTransaction.updateAccount(accounts[1].id);

		await transactionsService.update(updatedTransaction);

		expect(accounts[0].balance.valueOf()).toEqual(10);
		expect(accounts[1].balance.valueOf()).toEqual(-10);
		expect(accounts[2].balance.valueOf()).toEqual(0);
		expect(transactions[0].account.value).toEqual(accounts[1].id.value);
		expect(transactions[0].toAccount?.value).toEqual(accounts[2].id.value);
		expect(transactions[0].amount.valueOf()).toEqual(10);
	});
});

describe("record", () => {
	it("should record transfer transaction", async () => {});
});
