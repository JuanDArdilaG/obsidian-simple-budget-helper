import { Category, CategoryName } from "contexts/Categories/domain";
import {
	Transaction,
	TransactionDate,
	TransactionName,
} from "contexts/Transactions/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionOperation } from "contexts/Transactions/domain/transaction-operation.valueobject";
import { describe, expect, it } from "vitest";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

describe("transfer operation validation", () => {
	it("should throw error when creating transfer operation without toSplits", () => {
		const fromAccount = buildTestAccounts(1)[0];
		const fromSplits = [
			new AccountSplit(fromAccount.nanoid, new TransactionAmount(100)),
		];
		const toSplits: AccountSplit[] = []; // Empty toSplits for transfer
		const category = Category.create(new CategoryName("Test"));

		expect(() => {
			Transaction.create(
				TransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				new TransactionName("Transfer Test"),
				TransactionOperation.transfer(),
				category.nanoid,
				Nanoid.generate(),
			);
		}).toThrow("Transfer operations must have a toSplits array");
	});

	it("should allow transfer operation with valid toSplits", () => {
		const accounts = buildTestAccounts(2);
		const fromAccount = accounts[0];
		const toAccount = accounts[1];
		const fromSplits = [
			new AccountSplit(fromAccount.nanoid, new TransactionAmount(100)),
		];
		const toSplits = [
			new AccountSplit(toAccount.nanoid, new TransactionAmount(100)),
		];
		const category = Category.create(new CategoryName("Test"));

		expect(() => {
			Transaction.create(
				TransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				new TransactionName("Transfer Test"),
				TransactionOperation.transfer(),
				category.nanoid,
				Nanoid.generate(),
			);
		}).not.toThrow();
	});

	it("should throw error when setting empty toSplits for transfer operation", () => {
		const accounts = buildTestAccounts(2);
		const fromAccount = accounts[0];
		const toAccount = accounts[1];
		const fromSplits = [
			new AccountSplit(fromAccount.nanoid, new TransactionAmount(100)),
		];
		const toSplits = [
			new AccountSplit(toAccount.nanoid, new TransactionAmount(100)),
		];
		const category = Category.create(new CategoryName("Test"));

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			new TransactionName("Transfer Test"),
			TransactionOperation.transfer(),
			category.nanoid,
			Nanoid.generate(),
		);

		expect(() => {
			transaction.setDestinationAccounts([]);
		}).toThrow("Transfer operations must have a toSplits array");
	});

	it("should throw error when updating operation to transfer without toSplits", () => {
		const fromAccount = buildTestAccounts(1)[0];
		const fromSplits = [
			new AccountSplit(fromAccount.nanoid, new TransactionAmount(100)),
		];
		const toSplits: AccountSplit[] = []; // Empty toSplits
		const category = Category.create(new CategoryName("Test"));

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			new TransactionName("Test Transaction"),
			TransactionOperation.expense(),
			category.nanoid,
			Nanoid.generate(),
		);

		expect(() => {
			transaction.updateOperation(TransactionOperation.transfer());
		}).toThrow("Transfer operations must have a toSplits array");
	});

	it("should allow updating operation to transfer with valid toSplits", () => {
		const accounts = buildTestAccounts(2);
		const fromAccount = accounts[0];
		const toAccount = accounts[1];
		const fromSplits = [
			new AccountSplit(fromAccount.nanoid, new TransactionAmount(100)),
		];
		const toSplits = [
			new AccountSplit(toAccount.nanoid, new TransactionAmount(100)),
		];
		const category = Category.create(new CategoryName("Test"));

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			new TransactionName("Test Transaction"),
			TransactionOperation.expense(),
			category.nanoid,
			Nanoid.generate(),
		);

		expect(() => {
			transaction.updateOperation(TransactionOperation.transfer());
		}).not.toThrow();
	});
});

describe("getRealAmountForAccount", () => {
	it("should return positive amount for income transaction (base amount)", () => {
		const account = buildTestAccounts(1)[0];
		const fromSplits = [
			new AccountSplit(account.nanoid, new TransactionAmount(100)),
		];
		const toSplits: AccountSplit[] = [];
		const category = Category.create(new CategoryName("Test"));

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			new TransactionName("Income Transaction"),
			TransactionOperation.income(),
			category.nanoid,
			Nanoid.generate(),
		);

		// getRealAmountForAccount returns the base amount without considering account type
		const realAmount = transaction.getRealAmountForAccount(account.nanoid);
		expect(realAmount.value).toBe(100);
	});

	it("should return negative amount for expense transaction (base amount)", () => {
		const account = buildTestAccounts(1)[0];
		const fromSplits = [
			new AccountSplit(account.nanoid, new TransactionAmount(100)),
		];
		const toSplits: AccountSplit[] = [];
		const category = Category.create(new CategoryName("Test"));
		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			new TransactionName("Expense Transaction"),
			TransactionOperation.expense(),
			category.nanoid,
			Nanoid.generate(),
		);

		// getRealAmountForAccount returns the base amount without considering account type
		const realAmount = transaction.getRealAmountForAccount(account.nanoid);
		expect(realAmount.value).toBe(-100);
	});

	it("should return correct amount for transfer transaction", () => {
		const accounts = buildTestAccounts(2);
		const fromAccount = accounts[0];
		const toAccount = accounts[1];
		const fromSplits = [
			new AccountSplit(fromAccount.nanoid, new TransactionAmount(100)),
		];
		const toSplits = [
			new AccountSplit(toAccount.nanoid, new TransactionAmount(100)),
		];
		const category = Category.create(new CategoryName("Test"));

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			new TransactionName("Transfer Transaction"),
			TransactionOperation.transfer(),
			category.nanoid,
			Nanoid.generate(),
		);

		// For fromAccount: toAmount - fromAmount = 0 - 100 = -100
		const fromAccountAmount = transaction.getRealAmountForAccount(
			fromAccount.nanoid,
		);
		expect(fromAccountAmount.value).toBe(-100);

		// For toAccount: toAmount - fromAmount = 100 - 0 = 100
		const toAccountAmount = transaction.getRealAmountForAccount(
			toAccount.nanoid,
		);
		expect(toAccountAmount.value).toBe(100);
	});
});
