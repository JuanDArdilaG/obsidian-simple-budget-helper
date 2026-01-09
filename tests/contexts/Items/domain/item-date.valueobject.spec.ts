import { DateValueObject } from "@juandardilag/value-objects";
import { describe, expect, it } from "vitest";
import {
	ItemRecurrenceFrequency,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";

describe("next", () => {
	it("should calculate next date 1 day later correctly", () => {
		const prevDate = new ScheduledTransactionDate(new Date("2024-01-01"));
		const expectedDate = new ScheduledTransactionDate(
			new Date("2024-01-02")
		);

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("1d"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});

	it("should calculate next date 1 week later correctly", () => {
		const prevDate = new ScheduledTransactionDate(new Date("2024-01-01"));
		const expectedDate = new ScheduledTransactionDate(
			new Date("2024-01-08")
		);

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("1w"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});

	it("should calculate next date 1 month later correctly", () => {
		const prevDate = new ScheduledTransactionDate(new Date("2024-01-01"));
		const expectedDate = new ScheduledTransactionDate(
			new Date("2024-02-01")
		);

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("1mo"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});

	it("should calculate next date 1 year later correctly", () => {
		const prevDate = new ScheduledTransactionDate(new Date("2024-01-01"));
		const expectedDate = new ScheduledTransactionDate(
			new Date("2025-01-01")
		);

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("1y"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});

	it("should calculate next date 4 years 2 months and 19 days later correctly", () => {
		const prevDate = new ScheduledTransactionDate(new Date(2024, 0, 1));
		const expectedDate = new ScheduledTransactionDate(
			new Date(2028, 2, 20)
		);

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("4y2mo19d"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});

	it("should handle monthly recurrence with dates that don't exist in target month", () => {
		// January 30 -> February 28 (not March 2)
		const jan30 = new ScheduledTransactionDate(new Date(2024, 0, 30));
		const expectedFeb28 = new ScheduledTransactionDate(
			new Date(2024, 1, 29)
		);

		const nextDate = jan30.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedFeb28.value);
	});

	it("should handle monthly recurrence with dates that don't exist in target month - leap year", () => {
		// January 30 -> February 29 (leap year)
		const jan30 = new ScheduledTransactionDate(new Date(2024, 0, 30));
		const expectedFeb29 = new ScheduledTransactionDate(
			new Date(2024, 1, 29)
		);

		const nextDate = jan30.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedFeb29.value);
	});

	it("should handle monthly recurrence with dates that don't exist in target month - non-leap year", () => {
		// January 30 -> February 28 (non-leap year)
		const jan30 = new ScheduledTransactionDate(new Date(2023, 0, 30));
		const expectedFeb28 = new ScheduledTransactionDate(
			new Date(2023, 1, 28)
		);

		const nextDate = jan30.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedFeb28.value);
	});

	it("should handle monthly recurrence with March 31 -> April 30", () => {
		// March 31 -> April 30 (not May 1)
		const mar31 = new ScheduledTransactionDate(new Date(2024, 2, 31));
		const expectedApr30 = new ScheduledTransactionDate(
			new Date(2024, 3, 30)
		);

		const nextDate = mar31.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedApr30.value);
	});

	it("should handle monthly recurrence with January 31 -> February 28 (non-leap year)", () => {
		// January 31 -> February 28 (non-leap year)
		const jan31 = new ScheduledTransactionDate(new Date(2023, 0, 31));
		const expectedFeb28 = new ScheduledTransactionDate(
			new Date(2023, 1, 28)
		);

		const nextDate = jan31.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedFeb28.value);
	});

	it("should handle monthly recurrence with January 31 -> February 29 (leap year)", () => {
		// January 31 -> February 29 (leap year)
		const jan31 = new ScheduledTransactionDate(new Date(2024, 0, 31));
		const expectedFeb29 = new ScheduledTransactionDate(
			new Date(2024, 1, 29)
		);

		const nextDate = jan31.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedFeb29.value);
	});

	it("should handle monthly recurrence with May 31 -> June 30", () => {
		// May 31 -> June 30
		const may31 = new ScheduledTransactionDate(new Date(2024, 4, 31));
		const expectedJun30 = new ScheduledTransactionDate(
			new Date(2024, 5, 30)
		);

		const nextDate = may31.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedJun30.value);
	});

	it("should handle monthly recurrence with July 31 -> August 31", () => {
		// July 31 -> August 31 (both months have 31 days)
		const jul31 = new ScheduledTransactionDate(new Date(2024, 6, 31));
		const expectedAug31 = new ScheduledTransactionDate(
			new Date(2024, 7, 31)
		);

		const nextDate = jul31.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedAug31.value);
	});

	it("should handle monthly recurrence with August 31 -> September 30", () => {
		// August 31 -> September 30
		const aug31 = new ScheduledTransactionDate(new Date(2024, 7, 31));
		const expectedSep30 = new ScheduledTransactionDate(
			new Date(2024, 8, 30)
		);

		const nextDate = aug31.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedSep30.value);
	});

	it("should handle monthly recurrence with October 31 -> November 30", () => {
		// October 31 -> November 30
		const oct31 = new ScheduledTransactionDate(new Date(2024, 9, 31));
		const expectedNov30 = new ScheduledTransactionDate(
			new Date(2024, 10, 30)
		);

		const nextDate = oct31.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedNov30.value);
	});

	it("should handle monthly recurrence with December 31 -> January 31", () => {
		// December 31 -> January 31 (both months have 31 days)
		const dec31 = new ScheduledTransactionDate(new Date(2024, 11, 31));
		const expectedJan31 = new ScheduledTransactionDate(
			new Date(2025, 0, 31)
		);

		const nextDate = dec31.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedJan31.value);
	});

	it("should handle monthly recurrence with February 29 -> March 29 (leap year)", () => {
		// February 29 -> March 29 (leap year, both months have 29+ days)
		const feb29 = new ScheduledTransactionDate(new Date(2024, 1, 29));
		const expectedMar29 = new ScheduledTransactionDate(
			new Date(2024, 2, 29)
		);

		const nextDate = feb29.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedMar29.value);
	});

	it("should handle monthly recurrence with February 28 -> March 28 (non-leap year)", () => {
		// February 28 -> March 28 (non-leap year, both months have 28+ days)
		const feb28 = new ScheduledTransactionDate(new Date(2023, 1, 28));
		const expectedMar28 = new ScheduledTransactionDate(
			new Date(2023, 2, 28)
		);

		const nextDate = feb28.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedMar28.value);
	});

	it("should handle multiple months addition with overflow", () => {
		// January 31 + 2 months -> March 31
		const jan31 = new ScheduledTransactionDate(new Date(2024, 0, 31));
		const expectedMar31 = new ScheduledTransactionDate(
			new Date(2024, 2, 31)
		);

		const nextDate = jan31.next(new ItemRecurrenceFrequency("2mo"));

		expect(nextDate.value).toEqual(expectedMar31.value);
	});

	it("should handle multiple months addition with February overflow", () => {
		// January 31 + 1 month + 1 month -> March 31
		const jan31 = new ScheduledTransactionDate(new Date(2024, 0, 31));
		const expectedMar31 = new ScheduledTransactionDate(
			new Date(2024, 2, 31)
		);

		const nextDate = jan31.next(new ItemRecurrenceFrequency("2mo"));

		expect(nextDate.value).toEqual(expectedMar31.value);
	});

	it("should handle year boundary with monthly recurrence", () => {
		// December 31 -> January 31 (year boundary)
		const dec31 = new ScheduledTransactionDate(new Date(2023, 11, 31));
		const expectedJan31 = new ScheduledTransactionDate(
			new Date(2024, 0, 31)
		);

		const nextDate = dec31.next(new ItemRecurrenceFrequency("monthly"));

		expect(nextDate.value).toEqual(expectedJan31.value);
	});

	it("should handle leap year boundary with monthly recurrence", () => {
		// January 31, 2023 -> February 28, 2023 (non-leap year)
		const jan31_2023 = new ScheduledTransactionDate(new Date(2023, 0, 31));
		const expectedFeb28_2023 = new ScheduledTransactionDate(
			new Date(2023, 1, 28)
		);

		const nextDate = jan31_2023.next(
			new ItemRecurrenceFrequency("monthly")
		);

		expect(nextDate.value).toEqual(expectedFeb28_2023.value);
	});

	it("should handle leap year boundary with monthly recurrence - leap year", () => {
		// January 31, 2024 -> February 29, 2024 (leap year)
		const jan31_2024 = new ScheduledTransactionDate(new Date(2024, 0, 31));
		const expectedFeb29_2024 = new ScheduledTransactionDate(
			new Date(2024, 1, 29)
		);

		const nextDate = jan31_2024.next(
			new ItemRecurrenceFrequency("monthly")
		);

		expect(nextDate.value).toEqual(expectedFeb29_2024.value);
	});

	it("should handle complex frequency with months and days", () => {
		// January 31 + 1 month + 5 days -> March 5 (February overflow handled)
		const jan31 = new ScheduledTransactionDate(new Date(2024, 0, 31));
		const expectedMar5 = new ScheduledTransactionDate(new Date(2024, 2, 5));

		const nextDate = jan31.next(new ItemRecurrenceFrequency("1mo5d"));

		expect(nextDate.value).toEqual(expectedMar5.value);
	});

	it("should handle complex frequency with years, months and days", () => {
		// January 31, 2024 + 1 year + 1 month + 5 days -> March 5, 2025
		const jan31_2024 = new ScheduledTransactionDate(new Date(2024, 0, 31));
		const expectedMar5_2025 = new ScheduledTransactionDate(
			new Date(2025, 2, 5)
		);

		const nextDate = jan31_2024.next(
			new ItemRecurrenceFrequency("1y1mo5d")
		);

		expect(nextDate.value).toEqual(expectedMar5_2025.value);
	});

	it("should handle edge case with February 29 in leap year", () => {
		// February 29, 2024 + 1 month -> March 29, 2024
		const feb29_2024 = new ScheduledTransactionDate(new Date(2024, 1, 29));
		const expectedMar29_2024 = new ScheduledTransactionDate(
			new Date(2024, 2, 29)
		);

		const nextDate = feb29_2024.next(
			new ItemRecurrenceFrequency("monthly")
		);

		expect(nextDate.value).toEqual(expectedMar29_2024.value);
	});

	it("should handle edge case with February 28 in non-leap year", () => {
		// February 28, 2023 + 1 month -> March 28, 2023
		const feb28_2023 = new ScheduledTransactionDate(new Date(2023, 1, 28));
		const expectedMar28_2023 = new ScheduledTransactionDate(
			new Date(2023, 2, 28)
		);

		const nextDate = feb28_2023.next(
			new ItemRecurrenceFrequency("monthly")
		);

		expect(nextDate.value).toEqual(expectedMar28_2023.value);
	});

	it("should handle edge case with February 29 + 1 year in leap year", () => {
		// February 29, 2024 + 1 year -> March 1, 2025 (non-leap year, overflow handled)
		const feb29_2024 = new ScheduledTransactionDate(new Date(2024, 1, 29));
		const expectedMar1_2025 = new ScheduledTransactionDate(
			new Date(2025, 2, 1)
		);

		const nextDate = feb29_2024.next(new ItemRecurrenceFrequency("1y"));

		expect(nextDate.value).toEqual(expectedMar1_2025.value);
	});

	it("should handle edge case with February 28 + 1 year in non-leap year", () => {
		// February 28, 2023 + 1 year -> February 28, 2024 (leap year, but 28th exists)
		const feb28_2023 = new ScheduledTransactionDate(new Date(2023, 1, 28));
		const expectedFeb28_2024 = new ScheduledTransactionDate(
			new Date(2024, 1, 28)
		);

		const nextDate = feb28_2023.next(new ItemRecurrenceFrequency("1y"));

		expect(nextDate.value).toEqual(expectedFeb28_2024.value);
	});
});

describe("remainingDays", () => {
	it("should calculate 0 remaining days correctly", () => {
		const date = new ScheduledTransactionDate(new Date(2024, 0, 1));

		const remainingDays = date.getRemainingDays(
			new DateValueObject(new Date(2024, 0, 1))
		);

		expect(remainingDays).toBe(0);
	});

	it("should calculate -2 remaining days correctly", () => {
		const date = new ScheduledTransactionDate(new Date(2024, 0, 1));

		const remainingDays = date.getRemainingDays(
			new DateValueObject(new Date(2024, 0, 3))
		);

		expect(remainingDays).toBe(-2);
	});

	it("should calculate -2 remaining days with different time correctly", () => {
		const date = new ScheduledTransactionDate(new Date(2024, 0, 1, 19));

		const remainingDays = date.getRemainingDays(
			new DateValueObject(new Date(2024, 0, 3))
		);

		expect(remainingDays).toBe(-2);
	});
});
