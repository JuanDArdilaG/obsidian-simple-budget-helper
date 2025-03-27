import { describe, expect, it } from "vitest";
import { RecurrentItemNextDate } from "../../../../../src/contexts/Items/domain/RecurrentItem/recurrent-item-nextdate.valueobject";
import { RecurrrentItemFrequency } from "../../../../../src/contexts/Items/domain/RecurrentItem/recurrent-item-frequency.valueobject";

describe("next", () => {
	it("should calculate next date 1 day later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2024-01-02"));

		prevDate.next(new RecurrrentItemFrequency("1d"));

		expect(prevDate.valueOf()).toEqual(expectedDate.valueOf());
	});

	it("should calculate next date 1 week later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2024-01-08"));

		prevDate.next(new RecurrrentItemFrequency("1w"));

		expect(prevDate.valueOf()).toEqual(expectedDate.valueOf());
	});

	it("should calculate next date 1 month later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2024-02-01"));

		prevDate.next(new RecurrrentItemFrequency("1mo"));

		expect(prevDate.valueOf()).toEqual(expectedDate.valueOf());
	});

	it("should calculate next date 1 year later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2025-01-01"));

		prevDate.next(new RecurrrentItemFrequency("1y"));

		expect(prevDate.valueOf()).toEqual(expectedDate.valueOf());
	});

	it("should calculate next date 4 years 2 months and 19 days later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2028-03-22"));

		prevDate.next(new RecurrrentItemFrequency("4y2mo19d"));

		expect(prevDate.valueOf()).toEqual(expectedDate.valueOf());
	});
});
