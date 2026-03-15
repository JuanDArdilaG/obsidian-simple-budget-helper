import { Category, CategoryName } from "contexts/Categories/domain";
import { PriceVO } from "contexts/Shared/domain/value-objects/price.vo";
import {
	Transaction,
	TransactionDate,
	TransactionName,
} from "contexts/Transactions/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionItem } from "contexts/Transactions/domain/transaction-item.entity";
import { TransactionOperation } from "contexts/Transactions/domain/transaction-operation.valueobject";
import { describe, expect, it } from "vitest";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

const buildTransactionItems = (
	name: string,
	amount: number,
	categoryId: Nanoid,
	subcategoryId: Nanoid,
): TransactionItem[] => [
	new TransactionItem(
		new TransactionName(name),
		new PriceVO(amount),
		1,
		categoryId,
		subcategoryId,
	),
];

describe("transfer operation validation", () => {
	it("should throw error when creating transfer operation without toSplits", () => {
		const fromAccount = buildTestAccounts(1)[0];
		const fromSplits = [
			new AccountSplit(fromAccount.nanoid, new TransactionAmount(100)),
		];
		const toSplits: AccountSplit[] = []; // Empty toSplits for transfer
		const category = Category.create(new CategoryName("Test"));
		const subcategoryId = Nanoid.generate();

		expect(() => {
			Transaction.create(
				TransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				TransactionOperation.transfer(),
				buildTransactionItems(
					"Transfer Test",
					100,
					category.nanoid,
					subcategoryId,
				),
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
		const subcategoryId = Nanoid.generate();

		expect(() => {
			Transaction.create(
				TransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				TransactionOperation.transfer(),
				buildTransactionItems(
					"Transfer Test",
					100,
					category.nanoid,
					subcategoryId,
				),
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
		const subcategoryId = Nanoid.generate();

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			TransactionOperation.transfer(),
			buildTransactionItems(
				"Transfer Test",
				100,
				category.nanoid,
				subcategoryId,
			),
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
		const subcategoryId = Nanoid.generate();

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			TransactionOperation.expense(),
			buildTransactionItems(
				"Test Transaction",
				100,
				category.nanoid,
				subcategoryId,
			),
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
		const subcategoryId = Nanoid.generate();

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			TransactionOperation.expense(),
			buildTransactionItems(
				"Test Transaction",
				100,
				category.nanoid,
				subcategoryId,
			),
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
		const subcategoryId = Nanoid.generate();

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			TransactionOperation.income(),
			buildTransactionItems(
				"Income Transaction",
				100,
				category.nanoid,
				subcategoryId,
			),
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
		const subcategoryId = Nanoid.generate();
		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			TransactionOperation.expense(),
			buildTransactionItems(
				"Expense Transaction",
				100,
				category.nanoid,
				subcategoryId,
			),
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
		const subcategoryId = Nanoid.generate();

		const transaction = Transaction.create(
			TransactionDate.createNowDate(),
			fromSplits,
			toSplits,
			TransactionOperation.transfer(),
			buildTransactionItems(
				"Transfer Transaction",
				100,
				category.nanoid,
				subcategoryId,
			),
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
