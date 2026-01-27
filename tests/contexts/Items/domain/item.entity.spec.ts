import {
	DateValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { ItemOperation } from "contexts/Shared/domain/Item/item-operation.valueobject";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { describe, expect, it } from "vitest";
import {
	RecurrencePattern,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { buildTestItems } from "./buildTestItems";

describe("remainingDays", () => {
	it("should calculate remaining future 7 days correctly", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "1w",
					startDate: DateValueObject.createNowDate().addDays(7),
				},
			},
		]);
		const item = items[0];

		const str =
			item.recurrencePattern.getNthOccurrence(0)?.remainingDaysStr;

		expect(str).toBe("7 days");
	});

	it("should calculate remaining previous 7 days correctly", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "1w",
					startDate: DateValueObject.createNowDate().addDays(-7),
				},
			},
		]);
		const item = items[0];
		const str =
			item.recurrencePattern.getNthOccurrence(0)?.remainingDaysStr;

		expect(str).toBe("-7 days");
	});

	it("should calculate remaining 1 day correctly", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "1w",
					startDate: DateValueObject.createNowDate().addDays(1),
				},
			},
		]);
		const item = items[0];

		const str =
			item.recurrencePattern.getNthOccurrence(0)?.remainingDaysStr;

		expect(str).toBe("1 day");
	});

	it("should calculate remaining 1 day correctly", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "1w",
					startDate: DateValueObject.createNowDate().addDays(-1),
				},
			},
		]);
		const item = items[0];

		const str =
			item.recurrencePattern.getNthOccurrence(0)?.remainingDaysStr;

		expect(str).toBe("-1 day");
	});
});

describe("createRecurrences", () => {
	it("should return the total recurrences for a scheduled item with until date", async () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: new DateValueObject(new Date(2024, 0, 1)),
					untilDate: new DateValueObject(new Date(2024, 0, 16)),
				},
			},
		]);
		const item = items[0];

		const recurrences = item.recurrencePattern.generateOccurrencesUntil(
			new DateValueObject(new Date(2024, 0, 16)),
		);

		expect(recurrences[0].value).toEqual(new Date(2024, 0, 1));
		expect(recurrences[1].value).toEqual(new Date(2024, 0, 3));
		expect(recurrences[2].value).toEqual(new Date(2024, 0, 5));
		expect(recurrences[3].value).toEqual(new Date(2024, 0, 7));
		expect(recurrences[4].value).toEqual(new Date(2024, 0, 9));
		expect(recurrences[5].value).toEqual(new Date(2024, 0, 11));
		expect(recurrences[6].value).toEqual(new Date(2024, 0, 13));
		expect(recurrences[7].value).toEqual(new Date(2024, 0, 15));
	});
});

describe("transfer operation validation", () => {
	it("should throw error when creating transfer operation without toSplits", () => {
		const accounts = buildTestAccounts(1);
		const fromAccount = accounts[0];
		const fromSplits = [
			new AccountSplit(fromAccount.nanoid, new TransactionAmount(100)),
		];
		const toSplits: AccountSplit[] = []; // Empty toSplits for transfer

		expect(() => {
			ScheduledTransaction.create(
				new StringValueObject("Transfer Test"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				Nanoid.generate(),
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

		expect(() => {
			ScheduledTransaction.create(
				new StringValueObject("Transfer Test"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				Nanoid.generate(),
				Nanoid.generate(),
			);
		}).not.toThrow();
	});

	it("should throw error when updating operation to transfer without toSplits", () => {
		const accounts = buildTestAccounts(1);
		const fromAccount = accounts[0];
		const fromSplits = [
			new AccountSplit(fromAccount.nanoid, new TransactionAmount(100)),
		];
		const toSplits: AccountSplit[] = []; // Empty toSplits

		const item = ScheduledTransaction.create(
			new StringValueObject("Test Item"),
			RecurrencePattern.oneTime(ScheduledTransactionDate.createNowDate()),
			fromSplits,
			toSplits,
			ItemOperation.expense(),
			Nanoid.generate(),
			Nanoid.generate(),
		);

		expect(() => {
			item.updateOperation(ItemOperation.transfer());
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

		const item = ScheduledTransaction.create(
			new StringValueObject("Test Item"),
			RecurrencePattern.oneTime(ScheduledTransactionDate.createNowDate()),
			fromSplits,
			toSplits,
			ItemOperation.expense(),
			Nanoid.generate(),
			Nanoid.generate(),
		);

		expect(() => {
			item.updateOperation(ItemOperation.transfer());
		}).not.toThrow();
	});
});
