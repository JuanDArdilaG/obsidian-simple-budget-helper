import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Transaction, TransactionName } from "contexts/Transactions/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionOperation } from "contexts/Transactions/domain/transaction-operation.valueobject";
import { describe, expect, it } from "vitest";

describe("transfer operation validation", () => {
	it("should throw error when creating transfer operation without toSplits", () => {
		const fromAccount = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(fromAccount, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = []; // Empty toSplits for transfer

		expect(() => {
			Transaction.createWithoutItem(
				fromSplits,
				toSplits,
				new TransactionName("Transfer Test"),
				TransactionOperation.transfer(),
				CategoryID.generate(),
				SubCategoryID.generate()
			);
		}).toThrow("Transfer operations must have a toSplits array");
	});

	it("should allow transfer operation with valid toSplits", () => {
		const fromAccount = AccountID.generate();
		const toAccount = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(fromAccount, new TransactionAmount(100)),
		];
		const toSplits = [
			new PaymentSplit(toAccount, new TransactionAmount(100)),
		];

		expect(() => {
			Transaction.createWithoutItem(
				fromSplits,
				toSplits,
				new TransactionName("Transfer Test"),
				TransactionOperation.transfer(),
				CategoryID.generate(),
				SubCategoryID.generate()
			);
		}).not.toThrow();
	});

	it("should throw error when setting empty toSplits for transfer operation", () => {
		const fromAccount = AccountID.generate();
		const toAccount = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(fromAccount, new TransactionAmount(100)),
		];
		const toSplits = [
			new PaymentSplit(toAccount, new TransactionAmount(100)),
		];

		const transaction = Transaction.createWithoutItem(
			fromSplits,
			toSplits,
			new TransactionName("Transfer Test"),
			TransactionOperation.transfer(),
			CategoryID.generate(),
			SubCategoryID.generate()
		);

		expect(() => {
			transaction.setToSplits([]);
		}).toThrow("Transfer operations must have a toSplits array");
	});

	it("should throw error when updating operation to transfer without toSplits", () => {
		const fromAccount = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(fromAccount, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = []; // Empty toSplits

		const transaction = Transaction.createWithoutItem(
			fromSplits,
			toSplits,
			new TransactionName("Test Transaction"),
			TransactionOperation.expense(),
			CategoryID.generate(),
			SubCategoryID.generate()
		);

		expect(() => {
			transaction.updateOperation(TransactionOperation.transfer());
		}).toThrow("Transfer operations must have a toSplits array");
	});

	it("should allow updating operation to transfer with valid toSplits", () => {
		const fromAccount = AccountID.generate();
		const toAccount = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(fromAccount, new TransactionAmount(100)),
		];
		const toSplits = [
			new PaymentSplit(toAccount, new TransactionAmount(100)),
		];

		const transaction = Transaction.createWithoutItem(
			fromSplits,
			toSplits,
			new TransactionName("Test Transaction"),
			TransactionOperation.expense(),
			CategoryID.generate(),
			SubCategoryID.generate()
		);

		expect(() => {
			transaction.updateOperation(TransactionOperation.transfer());
		}).not.toThrow();
	});
});
