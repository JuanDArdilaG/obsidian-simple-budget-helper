import { DateValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { ItemDate } from "contexts/Items/domain/item-date.valueobject";
import { ItemName } from "contexts/Items/domain/item-name.valueobject";
import { ItemRecurrenceFrequency } from "contexts/Items/domain/item-recurrence-frequency.valueobject";
import {
	ERecurrenceState,
	ItemRecurrenceInfo,
} from "contexts/Items/domain/item-recurrence-modification.valueobject";
import { ScheduledItem } from "contexts/Items/domain/scheduled-item.entity";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { describe, expect, it } from "vitest";

describe("ScheduledItem Recurrence Management", () => {
	it("should modify, delete, complete, and record future recurrences correctly", () => {
		const startDate = new DateValueObject(new Date(2024, 0, 1));
		const frequency = new ItemRecurrenceFrequency("monthly");
		const accountId = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(accountId, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = [];
		const item = ScheduledItem.infinite(
			startDate,
			new ItemName("Test Item"),
			fromSplits,
			toSplits,
			ItemOperation.income(),
			CategoryID.generate(),
			SubCategoryID.generate(),
			frequency
		);

		// Modify 2nd recurrence
		const mod = new ItemRecurrenceInfo(
			new ItemDate(new Date("2024-02-15")),
			ERecurrenceState.PENDING
		);
		item.modifyRecurrence(1, mod);
		let rec = item
			.getAllRecurrencesWithStates()
			.find((r) => r.n.value === 1);
		expect(rec!.recurrence.date.value).toEqual(new Date("2024-02-15"));

		// Complete 3rd recurrence
		item.completeRecurrence(2);
		rec = item.getAllRecurrencesWithStates().find((r) => r.n.value === 2);
		expect(rec!.recurrence.state).toBe(ERecurrenceState.COMPLETED);

		// Delete 4th recurrence
		item.deleteRecurrence(3);
		rec = item.getAllRecurrencesWithStates().find((r) => r.n.value === 3);
		expect(rec!.recurrence.state).toBe(ERecurrenceState.DELETED);

		// Record future (5th) recurrence
		item.recordFutureRecurrence(4);
		rec = item.getAllRecurrencesWithStates().find((r) => r.n.value === 4);
		expect(rec!.recurrence.state).toBe(ERecurrenceState.COMPLETED);
	});

	it("should return correct recurrence stats", () => {
		const startDate = new DateValueObject(new Date(2024, 0, 1));
		const frequency = new ItemRecurrenceFrequency("monthly");
		const accountId = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(accountId, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = [];
		const item = ScheduledItem.infinite(
			startDate,
			new ItemName("Test Item"),
			fromSplits,
			toSplits,
			ItemOperation.income(),
			CategoryID.generate(),
			SubCategoryID.generate(),
			frequency
		);
		item.completeRecurrence(0);
		item.deleteRecurrence(1);
		const stats = item.getRecurrenceStats();
		expect(stats.completed).toBe(1);
		expect(stats.deleted).toBe(1);
		expect(stats.active).toBe(49);
		expect(stats.pending).toBe(48);
		expect(stats.total).toBe(50);
	});

	it("should throw for invalid recurrence index", () => {
		const startDate = new DateValueObject(new Date(2024, 0, 1));
		const frequency = new ItemRecurrenceFrequency("monthly");
		const accountId = AccountID.generate();
		const fromSplits = [
			new PaymentSplit(accountId, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = [];
		const item = ScheduledItem.infinite(
			startDate,
			new ItemName("Test Item"),
			fromSplits,
			toSplits,
			ItemOperation.income(),
			CategoryID.generate(),
			SubCategoryID.generate(),
			frequency
		);
		expect(() =>
			item.modifyRecurrence(
				-1,
				new ItemRecurrenceInfo(
					new ItemDate(new Date()),
					ERecurrenceState.PENDING
				)
			)
		).toThrow();
		expect(() => item.deleteRecurrence(100)).toThrow();
		expect(() => item.completeRecurrence(100)).toThrow();
		expect(() => item.recordFutureRecurrence(100)).toThrow();
	});
});
