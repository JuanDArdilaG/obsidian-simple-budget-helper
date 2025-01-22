import { describe, expect, it } from "vitest";
import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { BudgetItemSimple } from "./BudgetItemSimple";

describe("remainingDays", () => {
	it("should calculate remaining future 7 days correctly", () => {
		const now = new Date();
		const itemDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
		const item = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"income",
			itemDate
		);

		const { color, str } = item.remainingDays;

		expect(color).toBe("gold");
		expect(str).toBe("7 days.");
	});

	it("should calculate remaining previous 7 days correctly", () => {
		const now = new Date();
		const itemDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const item = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"income",
			itemDate
		);

		const { color, str } = item.remainingDays;

		expect(color).toBe("gold");
		expect(str).toBe("-7 days.");
	});

	it("should calculate remaining 1 day correctly", () => {
		const now = new Date();
		const itemDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
		const item = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"income",
			itemDate
		);

		const { color, str } = item.remainingDays;

		expect(color).toBe("gold");
		expect(str).toBe("1 day");
	});

	it("should calculate remaining 1 day correctly", () => {
		const now = new Date();
		const itemDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
		const item = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"income",
			itemDate
		);

		const { color, str } = item.remainingDays;

		expect(color).toBe("gold");
		expect(str).toBe("-1 day");
	});
});
