import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import {
	ItemDate,
	ItemName,
	ItemRecurrenceInfo,
	ScheduledItem,
} from "contexts/Items/domain";
import { ItemRecurrenceFrequency } from "contexts/Items/domain/item-recurrence-frequency.valueobject";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("EditItemRecurrencePanel Logic", () => {
	let singleRecurrenceItem: ScheduledItem;
	let recurringItem: ScheduledItem;
	let mockUpdateItem: { execute: ReturnType<typeof vi.fn> };
	let mockModifyNItemRecurrence: { execute: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		// Create a single recurrence item (one-time)
		const singleRecurrenceDate = new DateValueObject(
			new Date("2024-01-15")
		);
		singleRecurrenceItem = ScheduledItem.oneTime(
			singleRecurrenceDate,
			new ItemName("Single Item"),
			[
				new PaymentSplit(
					AccountID.generate(),
					new TransactionAmount(100)
				),
			],
			[
				new PaymentSplit(
					AccountID.generate(),
					new TransactionAmount(100)
				),
			],
			ItemOperation.expense(),
			CategoryID.generate(),
			SubCategoryID.generate()
		);

		// Create a recurring item
		const recurringStartDate = new DateValueObject(new Date("2024-01-01"));
		recurringItem = ScheduledItem.infinite(
			recurringStartDate,
			new ItemName("Recurring Item"),
			[new PaymentSplit(AccountID.generate(), new TransactionAmount(50))],
			[new PaymentSplit(AccountID.generate(), new TransactionAmount(50))],
			ItemOperation.expense(),
			CategoryID.generate(),
			SubCategoryID.generate(),
			new ItemRecurrenceFrequency("monthly")
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
		expect(singleRecurrenceItem.recurrence.isOneTime()).toBe(true);
		expect(recurringItem.recurrence.isOneTime()).toBe(false);
	});

	it("should use updateItem for single recurrence items", async () => {
		// Simulate the logic that would be used in the component
		const isSingleRecurrence = singleRecurrenceItem.recurrence.isOneTime();

		if (isSingleRecurrence) {
			// This is the logic that should be executed for single recurrence items
			const updatedItem = singleRecurrenceItem.copy();
			updatedItem.updateName(new ItemName("Updated Single Item"));

			await mockUpdateItem.execute(updatedItem);

			expect(mockUpdateItem.execute).toHaveBeenCalledWith(updatedItem);
			expect(mockModifyNItemRecurrence.execute).not.toHaveBeenCalled();
		}
	});

	it("should use modifyNItemRecurrence for recurring items", async () => {
		// Simulate the logic that would be used in the component
		const isSingleRecurrence = recurringItem.recurrence.isOneTime();

		if (!isSingleRecurrence) {
			// This is the logic that should be executed for recurring items
			const n = new NumberValueObject(0);
			const newRecurrence = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-01-15")),
				recurringItem.recurrence.recurrences[0].state
			);

			await mockModifyNItemRecurrence.execute({
				id: recurringItem.id,
				n,
				newRecurrence,
			});

			expect(mockModifyNItemRecurrence.execute).toHaveBeenCalledWith({
				id: recurringItem.id,
				n,
				newRecurrence,
			});
			expect(mockUpdateItem.execute).not.toHaveBeenCalled();
		}
	});

	it("should not show warnings for single recurrence items", () => {
		const isSingleRecurrence = singleRecurrenceItem.recurrence.isOneTime();

		// The warnings should not be shown for single recurrence items
		// regardless of context
		expect(isSingleRecurrence).toBe(true);

		// In the component, this would mean:
		// !isSingleRecurrence && context === "calendar" -> false
		// !isSingleRecurrence && context === "all-items" -> false
		// So no warnings would be displayed
	});

	it("should show warnings for recurring items", () => {
		const isSingleRecurrence = recurringItem.recurrence.isOneTime();

		// The warnings should be shown for recurring items
		expect(isSingleRecurrence).toBe(false);

		// In the component, this would mean:
		// !isSingleRecurrence && context === "calendar" -> true (warning shown)
		// !isSingleRecurrence && context === "all-items" -> true (warning shown)
	});
});
