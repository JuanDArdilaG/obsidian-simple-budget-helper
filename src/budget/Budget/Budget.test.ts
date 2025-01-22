import { describe, expect, it } from "vitest";
import { Budget } from "./Budget";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { getTestBudget } from "./BudgetHistory.test";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";

describe("get names", () => {
	it("should return unique names", () => {
		const budget = new Budget<BudgetItemSimple>([
			BudgetItemSimple.create("", "name 1", 0, "", "expense", new Date()),
			BudgetItemSimple.create("", "name 1", 0, "", "expense", new Date()),
			BudgetItemSimple.create("", "name 2", 0, "", "expense", new Date()),
			BudgetItemSimple.create("", "name 3", 0, "", "expense", new Date()),
			BudgetItemSimple.create("", "name 3", 0, "", "expense", new Date()),
			BudgetItemSimple.create("", "name 4", 0, "", "expense", new Date()),
			BudgetItemSimple.create("", "name 5", 0, "", "expense", new Date()),
		]);

		const names = budget.getNames();

		expect(names.length).toBe(5);
		expect(names).includes("name 1");
		expect(names).includes("name 2");
		expect(names).includes("name 3");
		expect(names).includes("name 4");
		expect(names).includes("name 5");
	});
});

describe("get accounts", () => {
	it("should return unique accounts", () => {
		const budget = new Budget<BudgetItemSimple>([
			BudgetItemSimple.create("acc 1", "", 0, "", "expense", new Date()),
			BudgetItemSimple.create("acc 1", "", 0, "", "expense", new Date()),
			BudgetItemSimple.create("acc 2", "", 0, "", "expense", new Date()),
			BudgetItemSimple.create("acc 3", "", 0, "", "expense", new Date()),
			BudgetItemSimple.create("acc 3", "", 0, "", "expense", new Date()),
			BudgetItemSimple.create("acc 4", "", 0, "", "expense", new Date()),
			BudgetItemSimple.create("acc 5", "", 0, "", "expense", new Date()),
		]);

		const accounts = budget.getAccounts();

		expect(accounts.length).toBe(5);
		expect(accounts).includes("acc 1");
		expect(accounts).includes("acc 2");
		expect(accounts).includes("acc 3");
		expect(accounts).includes("acc 4");
		expect(accounts).includes("acc 5");
	});
});

describe("getNDaysItems", () => {
	it("should return recurrent items multiple times if applicable", () => {
		const { budget, recurrent } = getTestBudget({
			recurrent: [{ frequency: "2d", nextDate: new Date() }],
		});

		const items = budget.getNDaysItems(7);

		expect(items.length).toBe(1);
		expect(items[0].item.name).includes(recurrent[0].name);
		expect(items[0].dates.length).toBe(4);
		expect(items[0].dates[0].getTime()).toBe(
			recurrent[0].nextDate.getTime()
		);
	});
});
