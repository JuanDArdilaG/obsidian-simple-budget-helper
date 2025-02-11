import { describe, expect, it } from "vitest";
import { BudgetItemNextDate } from "./BudgetItemNextDate";
import { FrequencyString } from "./FrequencyString";

describe("BudgetItemNextDate", () => {
	it("should calculate next date 1 day later correctly", () => {
		const prevDate = new BudgetItemNextDate(new Date("2024-01-01"), true);
		const expectedDate = new BudgetItemNextDate(
			new Date("2024-01-02"),
			true
		);

		const nextDate = prevDate.nextDate(new FrequencyString("1d"));

		expect(nextDate).toEqual(expectedDate);
	});

	it("should calculate next date 1 week later correctly", () => {
		const prevDate = new BudgetItemNextDate(new Date("2024-01-01"), true);
		const expectedDate = new BudgetItemNextDate(
			new Date("2024-01-08"),
			true
		);

		const nextDate = prevDate.nextDate(new FrequencyString("1w"));

		expect(nextDate).toEqual(expectedDate);
	});

	it("should calculate next date 1 month later correctly", () => {
		const prevDate = new BudgetItemNextDate(new Date("2024-01-01"), true);
		const expectedDate = new BudgetItemNextDate(
			new Date("2024-02-01"),
			true
		);

		const nextDate = prevDate.nextDate(new FrequencyString("1mo"));

		expect(nextDate).toEqual(expectedDate);
	});

	it("should calculate next date 1 year later correctly", () => {
		const prevDate = new BudgetItemNextDate(new Date("2024-01-01"), true);
		const expectedDate = new BudgetItemNextDate(
			new Date("2025-01-01"),
			true
		);

		const nextDate = prevDate.nextDate(new FrequencyString("1y"));

		expect(nextDate).toEqual(expectedDate);
	});

	it("should calculate next date 4 years 2 months and 19 days later correctly", () => {
		const prevDate = new BudgetItemNextDate(new Date("2024-01-01"), true);
		const expectedDate = new BudgetItemNextDate(
			new Date("2028-03-22"),
			true
		);

		const nextDate = prevDate.nextDate(new FrequencyString("4y2mo19d"));

		expect(nextDate).toEqual(expectedDate);
	});
});
