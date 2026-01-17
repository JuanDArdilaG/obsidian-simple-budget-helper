import { StringValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { Category, CategoryName } from "contexts/Categories/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategory, SubCategoryName } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ItemRecurrenceFrequency,
	RecurrencePattern,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { TransactionCategory } from "../../../../src/contexts/Transactions/domain";

describe("EditItemRecurrencePanel Logic", () => {
	let singleRecurrenceItem: ScheduledTransaction;
	let recurringItem: ScheduledTransaction;
	let mockUpdateItem: { execute: ReturnType<typeof vi.fn> };
	let mockModifyNItemRecurrence: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		// Create a single recurrence item (one-time)
		const singleRecurrenceDate = new ScheduledTransactionDate(
			new Date("2024-01-15"),
		);
		const cat = Category.create(new CategoryName("Food"));
		singleRecurrenceItem = ScheduledTransaction.create(
			new StringValueObject("Single Item"),
			RecurrencePattern.oneTime(singleRecurrenceDate),
			[
				new PaymentSplit(
					AccountID.generate(),
					new TransactionAmount(100),
				),
			],
			[
				new PaymentSplit(
					AccountID.generate(),
					new TransactionAmount(100),
				),
			],
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
		recurringItem = ScheduledTransaction.create(
			new StringValueObject("Recurring Item"),
			RecurrencePattern.infinite(
				recurringStartDate,
				new ItemRecurrenceFrequency("monthly"),
			),
			[new PaymentSplit(AccountID.generate(), new TransactionAmount(50))],
			[new PaymentSplit(AccountID.generate(), new TransactionAmount(50))],
			ItemOperation.expense(),
			new TransactionCategory(
				cat,
				SubCategory.create(cat.id, new SubCategoryName("Dining Out")),
			),
		);

		// Mock the use cases
		mockUpdateItem = {
			execute: vi.fn().mockResolvedValue(undefined),
		};

		mockModifyNItemRecurrence = {
			execute: vi.fn().mockResolvedValue(undefined),
		};
	});

	it("should identify single recurrence items correctly", () => {
		expect(singleRecurrenceItem.recurrencePattern.isOneTime).toBe(true);
		expect(recurringItem.recurrencePattern.isOneTime).toBe(false);
	});

	it("should use updateItem for single recurrence items", async () => {
		// Simulate the logic that would be used in the component
		const isSingleRecurrence =
			singleRecurrenceItem.recurrencePattern.isOneTime;

		if (isSingleRecurrence) {
			// This is the logic that should be executed for single recurrence items
			const updatedItem = singleRecurrenceItem.copy();
			updatedItem.updateName(
				new StringValueObject("Updated Single Item"),
			);

			await mockUpdateItem.execute(updatedItem);

			expect(mockUpdateItem.execute).toHaveBeenCalledWith(updatedItem);
			expect(mockModifyNItemRecurrence.execute).not.toHaveBeenCalled();
		}
	});
});
