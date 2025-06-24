import { DateValueObject, PriceValueObject } from "@juandardilag/value-objects";
import {
	Account,
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
} from "contexts/Accounts/domain";
import { CategoriesService } from "contexts/Categories/application/categories.service";
import { EntityNotFoundError } from "contexts/Shared/domain";
import { SubCategoriesService } from "contexts/Subcategories/application/subcategories.service";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";
import { Transaction, TransactionID } from "contexts/Transactions/domain";
import { describe, expect, it } from "vitest";
import { AccountsServiceMock } from "../../Accounts/application/accounts-service.mock";
import { buildTestTransactions } from "../../Reports/domain/buildTestTransactions";
import { TransactionsRepositoryMock } from "../domain/transactions-repository.mock";

describe("update", () => {
	it("should update from account for transfer transaction", async () => {
		const accounts = [
			new Account(
				AccountID.generate(),
				AccountType.asset(),
				new AccountName("test"),
				AccountBalance.zero(),
				DateValueObject.createNowDate()
			),
			new Account(
				AccountID.generate(),
				AccountType.asset(),
				new AccountName("test2"),
				AccountBalance.zero(),
				DateValueObject.createNowDate()
			),
			new Account(
				AccountID.generate(),
				AccountType.asset(),
				new AccountName("test3"),
				AccountBalance.zero(),
				DateValueObject.createNowDate()
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
		updatedTransaction.setFromSplits([
			...updatedTransaction.fromSplits.map((split, idx) =>
				idx === 0
					? new (Object.getPrototypeOf(split).constructor)(
							accounts[1].id,
							split.amount
					  )
					: split
			),
		]);

		await transactionsService.update(updatedTransaction);

		expect(accounts[0].balance.value.value).toEqual(10);
		expect(accounts[1].balance.value.value).toEqual(-10);
		expect(accounts[2].balance.value.value).toEqual(0);
		expect(updatedTransaction.fromSplits[0].accountId.value).toEqual(
			accounts[1].id.value
		);
		expect(updatedTransaction.toSplits[0].accountId.value).toEqual(
			accounts[2].id.value
		);
	});
});

describe("delete", () => {
	it("should decrease the debt on an expense transaction for a liability account", async () => {
		const liabilityAccount = new Account(
			AccountID.generate(),
			AccountType.liability(),
			new AccountName("Credit Card"),
			new AccountBalance(new PriceValueObject(-500)),
			DateValueObject.createNowDate()
		);
		const accounts = [liabilityAccount];
		const transactions = buildTestTransactions([
			{
				operation: "expense",
				account: liabilityAccount.id.value,
				amount: 100,
			},
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

		// Record the transaction first to adjust the balance
		await transactionsService.record(transactions[0]);
		expect(liabilityAccount.balance.value.value).toEqual(-600);

		// Now, delete the transaction
		await transactionsService.delete(transactions[0].id);

		// The balance should revert to the original state
		expect(liabilityAccount.balance.value.value).toEqual(-500);
	});

	it("should increase the balance on an expense transaction for an asset account", async () => {
		const assetAccount = new Account(
			AccountID.generate(),
			AccountType.asset(),
			new AccountName("Checking"),
			new AccountBalance(new PriceValueObject(500)),
			DateValueObject.createNowDate()
		);
		const accounts = [assetAccount];
		const transactions = buildTestTransactions([
			{
				operation: "expense",
				account: assetAccount.id.value,
				amount: 100,
			},
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

		// Record the transaction first to adjust the balance
		await transactionsService.record(transactions[0]);
		expect(assetAccount.balance.value.value).toEqual(400);

		// Now, delete the transaction
		await transactionsService.delete(transactions[0].id);

		// The balance should revert to the original state
		expect(assetAccount.balance.value.value).toEqual(500);
	});

	it("should decrease the balance on an income transaction for an asset account", async () => {
		const assetAccount = new Account(
			AccountID.generate(),
			AccountType.asset(),
			new AccountName("Checking"),
			new AccountBalance(new PriceValueObject(500)),
			DateValueObject.createNowDate()
		);
		const accounts = [assetAccount];
		const transactions = buildTestTransactions([
			{
				operation: "income",
				account: assetAccount.id.value,
				amount: 100,
			},
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

		await transactionsService.record(transactions[0]);
		expect(assetAccount.balance.value.value).toEqual(600);

		await transactionsService.delete(transactions[0].id);

		expect(assetAccount.balance.value.value).toEqual(500);
	});

	it("should increase the debt on an income transaction for a liability account", async () => {
		const liabilityAccount = new Account(
			AccountID.generate(),
			AccountType.liability(),
			new AccountName("Credit Card"),
			new AccountBalance(new PriceValueObject(-500)),
			DateValueObject.createNowDate()
		);
		const accounts = [liabilityAccount];
		const transactions = buildTestTransactions([
			{
				operation: "income", // e.g., a payment to the card
				account: liabilityAccount.id.value,
				amount: 100,
			},
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

		await transactionsService.record(transactions[0]);
		expect(liabilityAccount.balance.value.value).toEqual(-400);

		await transactionsService.delete(transactions[0].id);

		expect(liabilityAccount.balance.value.value).toEqual(-500);
	});

	it("should revert balances on a transfer transaction between two asset accounts", async () => {
		const fromAccount = new Account(
			AccountID.generate(),
			AccountType.asset(),
			new AccountName("Checking"),
			new AccountBalance(new PriceValueObject(500)),
			DateValueObject.createNowDate()
		);
		const toAccount = new Account(
			AccountID.generate(),
			AccountType.asset(),
			new AccountName("Savings"),
			new AccountBalance(new PriceValueObject(1000)),
			DateValueObject.createNowDate()
		);
		const accounts = [fromAccount, toAccount];
		const transactions = buildTestTransactions([
			{
				operation: "transfer",
				account: fromAccount.id.value,
				toAccount: toAccount.id.value,
				amount: 100,
			},
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

		await transactionsService.record(transactions[0]);
		expect(fromAccount.balance.value.value).toEqual(400);
		expect(toAccount.balance.value.value).toEqual(1100);

		await transactionsService.delete(transactions[0].id);

		expect(fromAccount.balance.value.value).toEqual(500);
		expect(toAccount.balance.value.value).toEqual(1000);
	});

	it("should not change the balance when deleting a zero-amount transaction", async () => {
		const assetAccount = new Account(
			AccountID.generate(),
			AccountType.asset(),
			new AccountName("Checking"),
			new AccountBalance(new PriceValueObject(500)),
			DateValueObject.createNowDate()
		);
		const accounts = [assetAccount];
		const transactions = buildTestTransactions([
			{
				operation: "expense",
				account: assetAccount.id.value,
				amount: 0,
			},
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

		await transactionsService.record(transactions[0]);
		expect(assetAccount.balance.value.value).toEqual(500);

		await transactionsService.delete(transactions[0].id);

		expect(assetAccount.balance.value.value).toEqual(500);
	});

	it("should throw an error when trying to delete a non-existent transaction", async () => {
		const transactionsRepository = new TransactionsRepositoryMock([]);
		const accountsService = new AccountsServiceMock([]);
		const transactionsService = new TransactionsService(
			accountsService,
			transactionsRepository,
			{} as CategoriesService,
			{} as SubCategoriesService
		);

		const nonExistentId = TransactionID.generate();

		await expect(transactionsService.delete(nonExistentId)).rejects.toThrow(
			EntityNotFoundError
		);
	});
});

describe("record", () => {
	it("should record transfer transaction", async () => {});
});
