import { StringValueObject } from "@juandardilag/value-objects";
import { Category, CategoryName } from "contexts/Categories/domain";
import { ItemOperation, Nanoid } from "contexts/Shared/domain";
import { SubCategory, SubCategoryName } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { describe, expect, it } from "vitest";
import {
	ItemRecurrenceFrequency,
	RecurrencePattern,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { TransactionCategory } from "../../../../src/contexts/Transactions/domain";

describe("EditItemRecurrencePanel Logic", () => {
	it("should identify single recurrence items correctly", () => {
		// Create a single recurrence item (one-time)
		const singleRecurrenceDate = new ScheduledTransactionDate(
			new Date("2024-01-15"),
		);
		const cat = Category.create(new CategoryName("Food"));
		const singleRecurrenceItem = ScheduledTransaction.create(
			new StringValueObject("Single Item"),
			RecurrencePattern.oneTime(singleRecurrenceDate),
			[new PaymentSplit(Nanoid.generate(), new TransactionAmount(100))],
			[new PaymentSplit(Nanoid.generate(), new TransactionAmount(100))],
			ItemOperation.expense(),
			new TransactionCategory(
				cat,
				SubCategory.create(cat.id, new SubCategoryName("Groceries")),
			),
		);

		// Create a recurring item
		const recurringStartDate = new ScheduledTransactionDate(
			new Date("2024-01-01"),
		);
		const recurringItem = ScheduledTransaction.create(
			new StringValueObject("Recurring Item"),
			RecurrencePattern.infinite(
				recurringStartDate,
				new ItemRecurrenceFrequency("monthly"),
			),
			[new PaymentSplit(Nanoid.generate(), new TransactionAmount(50))],
			[new PaymentSplit(Nanoid.generate(), new TransactionAmount(50))],
			ItemOperation.expense(),
			new TransactionCategory(
				cat,
				SubCategory.create(cat.id, new SubCategoryName("Dining Out")),
			),
		);

		expect(singleRecurrenceItem.recurrencePattern.isOneTime).toBe(true);
		expect(recurringItem.recurrencePattern.isOneTime).toBe(false);
	});
});
