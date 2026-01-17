import {
	DateValueObject,
	NumberValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import { ItemOperation } from "contexts/Shared/domain/Item/item-operation.valueobject";
import { SubCategory, SubCategoryName } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { describe, expect, it } from "vitest";
import {
	RecurrencePattern,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { TransactionCategory } from "../../../../src/contexts/Transactions/domain";
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
		const item = items[0].copy();

		const str = item.recurrencePattern.getNthOccurrence(
			NumberValueObject.zero(),
		)?.remainingDaysStr;

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
		const item = items[0].copy();
		const str = item.recurrencePattern.getNthOccurrence(
			NumberValueObject.zero(),
		)?.remainingDaysStr;

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
		const item = items[0].copy();

		const str = item.recurrencePattern.getNthOccurrence(
			NumberValueObject.zero(),
		)?.remainingDaysStr;

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
		const item = items[0].copy();

		const str = item.recurrencePattern.getNthOccurrence(
			NumberValueObject.zero(),
		)?.remainingDaysStr;

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
		const fromAccount = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(fromAccount, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = []; // Empty toSplits for transfer

		expect(() => {
			ScheduledTransaction.create(
				new StringValueObject("Transfer Test"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new TransactionCategory(
					Category.create(new CategoryName("Test")),
					SubCategory.create(
						CategoryID.generate(),
						new SubCategoryName("Test Subcategory"),
					),
				),
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
			ScheduledTransaction.create(
				new StringValueObject("Transfer Test"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new TransactionCategory(
					Category.create(new CategoryName("Test")),
					SubCategory.create(
						CategoryID.generate(),
						new SubCategoryName("Test Subcategory"),
					),
				),
			);
		}).not.toThrow();
	});

	it("should throw error when updating operation to transfer without toSplits", () => {
		const fromAccount = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(fromAccount, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = []; // Empty toSplits

		const item = ScheduledTransaction.create(
			new StringValueObject("Test Item"),
			RecurrencePattern.oneTime(ScheduledTransactionDate.createNowDate()),
			fromSplits,
			toSplits,
			ItemOperation.expense(),
			new TransactionCategory(
				Category.create(new CategoryName("Test")),
				SubCategory.create(
					CategoryID.generate(),
					new SubCategoryName("Test Subcategory"),
				),
			),
		);

		expect(() => {
			item.updateOperation(ItemOperation.transfer());
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

		const item = ScheduledTransaction.create(
			new StringValueObject("Test Item"),
			RecurrencePattern.oneTime(ScheduledTransactionDate.createNowDate()),
			fromSplits,
			toSplits,
			ItemOperation.expense(),
			new TransactionCategory(
				Category.create(new CategoryName("Test")),
				SubCategory.create(
					CategoryID.generate(),
					new SubCategoryName("Test Subcategory"),
				),
			),
		);

		expect(() => {
			item.updateOperation(ItemOperation.transfer());
		}).not.toThrow();
	});
});
