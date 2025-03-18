import { describe, expect, it } from "vitest";
import { RecurrentItemNextDate } from "./recurrent-item-nextdate.valueobject";
import { RecurrrentItemFrequency } from "./recurrent-item-frequency.valueobject";

describe("RecurrentItemNextDate", () => {
	it("should calculate next date 1 day later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2024-01-02"));

		const nextDate = prevDate.nextDate(new RecurrrentItemFrequency("1d"));

		expect(nextDate).toEqual(expectedDate);
	});

	it("should calculate next date 1 week later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2024-01-08"));

		const nextDate = prevDate.nextDate(new RecurrrentItemFrequency("1w"));

		expect(nextDate).toEqual(expectedDate);
	});

	it("should calculate next date 1 month later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2024-02-01"));

		const nextDate = prevDate.nextDate(new RecurrrentItemFrequency("1mo"));

		expect(nextDate).toEqual(expectedDate);
	});

	it("should calculate next date 1 year later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2025-01-01"));

		const nextDate = prevDate.nextDate(new RecurrrentItemFrequency("1y"));

		expect(nextDate).toEqual(expectedDate);
	});

	it("should calculate next date 4 years 2 months and 19 days later correctly", () => {
		const prevDate = new RecurrentItemNextDate(new Date("2024-01-01"));
		const expectedDate = new RecurrentItemNextDate(new Date("2028-03-22"));

		const nextDate = prevDate.nextDate(
			new RecurrrentItemFrequency("4y2mo19d")
		);

		expect(nextDate).toEqual(expectedDate);
	});
});
