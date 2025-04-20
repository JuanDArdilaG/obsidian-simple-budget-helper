import { ItemDate, ItemRecurrenceFrequency } from "contexts/Items/domain";
import { describe, expect, it } from "vitest";

describe("next", () => {
	it("should calculate next date 1 day later correctly", () => {
		const prevDate = new ItemDate(new Date("2024-01-01"));
		const expectedDate = new ItemDate(new Date("2024-01-02"));

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("1d"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});

	it("should calculate next date 1 week later correctly", () => {
		const prevDate = new ItemDate(new Date("2024-01-01"));
		const expectedDate = new ItemDate(new Date("2024-01-08"));

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("1w"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});

	it("should calculate next date 1 month later correctly", () => {
		const prevDate = new ItemDate(new Date("2024-01-01"));
		const expectedDate = new ItemDate(new Date("2024-02-01"));

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("1mo"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});

	it("should calculate next date 1 year later correctly", () => {
		const prevDate = new ItemDate(new Date("2024-01-01"));
		const expectedDate = new ItemDate(new Date("2025-01-01"));

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("1y"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});

	it("should calculate next date 4 years 2 months and 19 days later correctly", () => {
		const prevDate = new ItemDate(new Date("2024-01-01"));
		const expectedDate = new ItemDate(new Date("2028-03-22"));

		const nextDate = prevDate.next(new ItemRecurrenceFrequency("4y2mo19d"));

		expect(nextDate.value).toEqual(expectedDate.value);
	});
});
