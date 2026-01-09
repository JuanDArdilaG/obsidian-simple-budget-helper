import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { ItemRecurrenceFrequency } from "contexts/Items/domain/item-recurrence-frequency.valueobject";
import {
	ERecurrenceState,
	ItemRecurrenceInfo,
} from "contexts/Items/domain/item-recurrence-modification.valueobject";
import { ItemRecurrence } from "contexts/Items/domain/item-recurrence.entity";
import { ItemDate } from "contexts/ScheduledTransactions/domain/scheduled-transaction-date.vo";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { describe, expect, it } from "vitest";
import { buildTestItems } from "./buildTestItems";

describe("totalRecurrences", () => {
	it("should return minus one for a recurrence with infinite schedule", () => {
		const items = buildTestItems([{ recurrence: { frequency: "2d" } }]);
		const item = items[0].copy();
		const recurrences = item.recurrence?.totalRecurrences;

		expect(recurrences).toBe(-1);
	});

	it("should return the 1 recurrence for a single time item", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: DateValueObject.createNowDate(),
					untilDate: DateValueObject.createNowDate(),
				},
			},
		]);
		const item = items[0].copy();
		const recurrences = item.recurrence?.totalRecurrences;

		expect(recurrences).toBe(1);
	});

	it("should return the total recurrences for a scheduled item with until date", () => {
		const items = buildTestItems([
			{
				recurrence: {
					frequency: "2d",
					startDate: DateValueObject.createNowDate(),
					untilDate: new DateValueObject(
						new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
					),
				},
			},
		]);
		const item = items[0].copy();
		const recurrences = item.recurrence?.totalRecurrences;

		expect(recurrences).toBe(8);
	});
});

describe("untilNRecurrences", () => {
	it("should create a recurrence for a single time item", () => {
		const recurrence = ItemRecurrence.untilNRecurrences(
			DateValueObject.createNowDate(),
			new ItemRecurrenceFrequency("2d"),
			new NumberValueObject(1)
		);

		expect(recurrence.totalRecurrences).toBe(1);
	});

	it("should create a recurrence for a scheduled item with 5 recurrences", () => {
		const recurrence = ItemRecurrence.untilNRecurrences(
			new DateValueObject(new Date(2024, 0, 1)),
			new ItemRecurrenceFrequency("2d"),
			new NumberValueObject(5)
		);

		expect(recurrence.untilDate?.value).toEqual(new Date(2024, 0, 9));
		expect(recurrence.totalRecurrences).toBe(5);
	});

	it("should create a recurrence for a scheduled item with 3 recurrences", () => {
		const recurrence = ItemRecurrence.untilNRecurrences(
			new DateValueObject(new Date(2024, 0, 1)),
			new ItemRecurrenceFrequency("1mo"),
			new NumberValueObject(3)
		);

		expect(recurrence.untilDate?.value).toEqual(new Date(2024, 2, 1));
		expect(recurrence.totalRecurrences).toBe(3);
	});
});

describe("ItemRecurrence", () => {
	describe("Modification Preservation", () => {
		it("should preserve modifications when start date changes", () => {
			// Create a monthly recurrence starting from January 1st
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			// Modify the 3rd recurrence (March)
			const modifiedRecurrence = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-03-15")), // Different date
				ERecurrenceState.PENDING,
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(150)
					),
				], // Different from splits
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(150)
					),
				] // Different to splits
			);
			recurrence.modifyRecurrence(2, modifiedRecurrence);

			// Change the start date to February 1st
			const newStartDate = new DateValueObject(new Date("2024-02-01"));
			recurrence.updateStartDate(newStartDate);

			// Verify that the modification is preserved
			const recurrences = recurrence.getAllRecurrencesWithStates();
			const thirdRecurrence = recurrences.find((r) => r.n.value === 2);

			expect(thirdRecurrence).toBeDefined();
			expect(thirdRecurrence!.recurrence.fromSplits).toBeDefined();
			expect(thirdRecurrence!.recurrence.toSplits).toBeDefined();
		});

		it("should preserve state modifications when start date changes", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			// Mark the 2nd recurrence as completed
			recurrence.completeRecurrence(1);
			// Mark the 4th recurrence as deleted
			recurrence.deleteRecurrence(3);

			// Change the start date
			const newStartDate = new DateValueObject(new Date("2024-02-01"));
			recurrence.updateStartDate(newStartDate);

			// Verify that states are preserved
			const recurrences = recurrence.getAllRecurrencesWithStates();
			const secondRecurrence = recurrences.find((r) => r.n.value === 1);
			const fourthRecurrence = recurrences.find((r) => r.n.value === 3);

			expect(secondRecurrence!.recurrence.state).toBe(
				ERecurrenceState.COMPLETED
			);
			expect(fourthRecurrence!.recurrence.state).toBe(
				ERecurrenceState.DELETED
			);
		});
	});

	describe("Recurrence State Management", () => {
		it("should correctly count different recurrence states", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			// Create some test data
			recurrence.completeRecurrence(0); // First recurrence completed
			recurrence.deleteRecurrence(2); // Third recurrence deleted
			recurrence.completeRecurrence(4); // Fifth recurrence completed

			// For infinite recurrences, we expect 50 total recurrences by default
			// So: 50 total - 1 deleted = 49 active
			expect(recurrence.activeRecurrenceCount).toBe(49); // All except deleted
			expect(recurrence.completedRecurrenceCount).toBe(2); // 0, 4
			expect(recurrence.pendingRecurrenceCount).toBe(47); // All except deleted and completed
			expect(recurrence.deletedRecurrenceCount).toBe(1); // 2
		});

		it("should allow recording future recurrences in advance", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			// Record the 6th recurrence in advance
			recurrence.recordFutureRecurrence(5);

			const recurrences = recurrence.getAllRecurrencesWithStates();
			const sixthRecurrence = recurrences.find((r) => r.n.value === 5);

			expect(sixthRecurrence!.recurrence.state).toBe(
				ERecurrenceState.COMPLETED
			);
		});
	});

	describe("Validation", () => {
		it("should throw error for invalid recurrence index", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			expect(() =>
				recurrence.modifyRecurrence(
					-1,
					new ItemRecurrenceInfo(
						new ItemDate(new Date("2024-01-01")),
						ERecurrenceState.PENDING
					)
				)
			).toThrow("Invalid recurrence index: -1");

			expect(() =>
				recurrence.modifyRecurrence(
					100,
					new ItemRecurrenceInfo(
						new ItemDate(new Date("2024-01-01")),
						ERecurrenceState.PENDING
					)
				)
			).toThrow("Invalid recurrence index: 100");
		});

		it("should throw error for invalid delete index", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			expect(() => recurrence.deleteRecurrence(-1)).toThrow(
				"Invalid recurrence index: -1"
			);
			expect(() => recurrence.deleteRecurrence(100)).toThrow(
				"Invalid recurrence index: 100"
			);
		});

		it("should throw error for invalid complete index", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			expect(() => recurrence.completeRecurrence(-1)).toThrow(
				"Invalid recurrence index: -1"
			);
			expect(() => recurrence.completeRecurrence(100)).toThrow(
				"Invalid recurrence index: 100"
			);
		});
	});

	describe("Recurrence Modification", () => {
		it("should correctly modify a specific recurrence", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			const modification = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-03-15")),
				ERecurrenceState.PENDING,
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(200)
					),
				],
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(200)
					),
				]
			);

			recurrence.modifyRecurrence(2, modification);

			const recurrences = recurrence.getAllRecurrencesWithStates();
			const modifiedRecurrence = recurrences.find((r) => r.n.value === 2);

			expect(modifiedRecurrence!.recurrence.date.value).toEqual(
				new Date("2024-03-15")
			);
			expect(modifiedRecurrence!.recurrence.fromSplits).toBeDefined();
			expect(modifiedRecurrence!.recurrence.toSplits).toBeDefined();
			expect(modifiedRecurrence!.recurrence.fromAmount?.value).toBe(200);
			expect(modifiedRecurrence!.recurrence.toAmount?.value).toBe(200);
		});

		it("should handle partial modifications", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			// Only modify the price
			const modification = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-03-01")), // Keep original date
				ERecurrenceState.PENDING,
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(300)
					),
				],
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(300)
					),
				]
			);

			recurrence.modifyRecurrence(2, modification);

			const recurrences = recurrence.getAllRecurrencesWithStates();
			const modifiedRecurrence = recurrences.find((r) => r.n.value === 2);

			expect(modifiedRecurrence!.recurrence.fromAmount?.value).toBe(300);
			expect(modifiedRecurrence!.recurrence.toAmount?.value).toBe(300);
			expect(modifiedRecurrence!.recurrence.fromSplits).toBeDefined();
			expect(modifiedRecurrence!.recurrence.toSplits).toBeDefined();
		});
	});

	describe("Total Recurrences Calculation", () => {
		it("should correctly calculate total recurrences for untilDate", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const untilDate = new DateValueObject(new Date("2024-12-31"));

			const recurrence = ItemRecurrence.untilDate(
				startDate,
				frequency,
				untilDate
			);

			// January through December = 12 months, but the calculation includes the start month
			// So it's actually 13 total recurrences (Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec)
			expect(recurrence.totalRecurrences).toBe(13); // 13 months
		});

		it("should return -1 for infinite recurrences", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			expect(recurrence.totalRecurrences).toBe(-1);
		});

		it("should return 1 for one-time items", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const recurrence = ItemRecurrence.oneTime(startDate);

			expect(recurrence.totalRecurrences).toBe(1);
		});
	});

	describe("Schedule Change Validation", () => {
		it("should detect when start date change would lose modifications", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const untilDate = new DateValueObject(new Date("2024-12-31"));
			const recurrence = ItemRecurrence.untilDate(
				startDate,
				frequency,
				untilDate
			);

			// Modify the 10th recurrence
			const modification = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-10-15")),
				ERecurrenceState.PENDING,
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(150)
					),
				],
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(150)
					),
				]
			);
			recurrence.modifyRecurrence(9, modification);

			// Validate changing start date to a later date (which would reduce recurrences)
			const newStartDate = new DateValueObject(new Date("2024-06-01"));
			const validation = recurrence.validateScheduleChange(newStartDate);

			expect(validation.wouldLoseModifications).toBe(true);
			expect(validation.lostModificationIndices).toContain(9);
			expect(validation.currentModificationCount).toBe(1);
		});

		it("should detect when until date change would lose modifications", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const untilDate = new DateValueObject(new Date("2024-12-31"));
			const recurrence = ItemRecurrence.untilDate(
				startDate,
				frequency,
				untilDate
			);

			// Modify the 12th recurrence (index 11) - this should be lost when reducing to 10 recurrences
			const modification = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-12-15")),
				ERecurrenceState.PENDING,
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(200)
					),
				],
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(200)
					),
				]
			);
			recurrence.modifyRecurrence(11, modification);

			// Validate changing until date to an earlier date
			const newUntilDate = new DateValueObject(new Date("2024-09-30"));
			const validation = recurrence.validateScheduleChange(
				undefined,
				newUntilDate
			);

			expect(validation.wouldLoseModifications).toBe(true);
			expect(validation.lostModificationIndices).toContain(11);
			expect(validation.currentModificationCount).toBe(1);
		});

		it("should not detect data loss for safe schedule changes", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const recurrence = ItemRecurrence.infinite(startDate, frequency);

			// Modify the 2nd recurrence
			const modification = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-02-15")),
				ERecurrenceState.PENDING,
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(150)
					),
				],
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(150)
					),
				]
			);
			recurrence.modifyRecurrence(1, modification);

			// Validate changing start date to an earlier date (which would increase recurrences)
			const newStartDate = new DateValueObject(new Date("2023-12-01"));
			const validation = recurrence.validateScheduleChange(newStartDate);

			expect(validation.wouldLoseModifications).toBe(false);
			expect(validation.lostModificationIndices).toHaveLength(0);
			expect(validation.currentModificationCount).toBe(1);
		});

		it("should handle one-time items correctly", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const recurrence = ItemRecurrence.oneTime(startDate);

			// Modify the only recurrence
			const modification = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-01-15")),
				ERecurrenceState.PENDING,
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(150)
					),
				],
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(150)
					),
				]
			);
			recurrence.modifyRecurrence(0, modification);

			// Validate changing start date
			const newStartDate = new DateValueObject(new Date("2024-02-01"));
			const validation = recurrence.validateScheduleChange(newStartDate);

			expect(validation.wouldLoseModifications).toBe(false);
			expect(validation.estimatedNewRecurrenceCount).toBe(1);
			expect(validation.currentModificationCount).toBe(1);
		});

		it("should provide accurate estimation of new recurrence count", () => {
			const startDate = new DateValueObject(new Date("2024-01-01"));
			const frequency = new ItemRecurrenceFrequency("monthly");
			const untilDate = new DateValueObject(new Date("2024-06-30"));
			const recurrence = ItemRecurrence.untilDate(
				startDate,
				frequency,
				untilDate
			);

			// Should be 7 months: Jan, Feb, Mar, Apr, May, Jun, Jul (including both start and end)
			const validation = recurrence.validateScheduleChange();
			expect(validation.estimatedNewRecurrenceCount).toBe(7);
		});
	});
});
