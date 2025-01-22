import { getTestBudget } from "budget/Budget/BudgetHistory.test";
import { describe, expect, it } from "vitest";

describe("getRecurrenceDatesForNDays", () => {
	it("should return recurrent items multiple times if applicable", () => {
		const { recurrent } = getTestBudget({
			recurrent: [{ frequency: "2d", nextDate: new Date() }],
		});
		const item = recurrent[0];

		const dates = item.getRecurrenceDatesForNDays(7);

		expect(dates.length).toBe(4);
		expect(dates[0].getTime()).toBe(item.nextDate.getTime());
		expect(dates[1].getTime()).toBe(
			item.nextDate.getTime() + 2 * 24 * 60 * 60 * 1000
		);
		expect(dates[2].getTime()).toBe(
			item.nextDate.getTime() + 4 * 24 * 60 * 60 * 1000
		);
		expect(dates[3].getTime()).toBe(
			item.nextDate.getTime() + 6 * 24 * 60 * 60 * 1000
		);
	});
});
