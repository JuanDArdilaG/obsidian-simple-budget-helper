import { describe, expect, it } from "vitest";
import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { Budget } from "./Budget";
import { BudgetHistory } from "./BudgetHistory";
import { FrequencyString } from "budget/BudgetItem/FrequencyString";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";

describe("getBalance", () => {
	it("should return the correct balance for one simple item", () => {
		const { budget } = getTestBudget({ simple: 1 });
		const expectedBalance = -100;
		const budgetHistory = BudgetHistory.fromBudget(budget);

		const balance = budgetHistory.getBalance();

		expect(balance).toBe(expectedBalance);
	});

	it("should return the correct balance for one recurrent item", () => {
		const { budget } = getTestBudget({ recurrent: [{}] });
		const expectedBalance = 300;
		const budgetHistory = BudgetHistory.fromBudget(budget);

		const balance = budgetHistory.getBalance();

		expect(balance).toBe(expectedBalance);
	});

	it("should return the correct balance for multiple items", () => {
		const { budget } = getTestBudget({ simple: 3, recurrent: [{}, {}] });
		const expectedBalance = 300;
		const budgetHistory = BudgetHistory.fromBudget(budget);

		const balance = budgetHistory.getBalance();

		expect(balance).toBe(expectedBalance);
	});

	it("should return the correct balance for one simple item with until date", () => {
		const { budget } = getTestBudget({ simple: 1 });
		const untilDate = new Date(2024, 0, 1);
		const budgetHistory = BudgetHistory.fromBudget(budget);

		const balance = budgetHistory.getBalance({ untilDate: untilDate });

		expect(balance).toBe(-100);
	});
});

describe("getGroupedByYearMonthDay", () => {
	it("should group items by year, month, and day - 1 day", () => {
		const { budget, simple } = getTestBudget({ simple: 1 });
		const budgetHistory = BudgetHistory.fromBudget(budget);

		const grouped = budgetHistory.getGroupedByYearMonthDay();

		expect(grouped).toEqual({
			2024: {
				Jan: {
					1: [...simple.map((item) => item.history).flat()],
				},
			},
		});
	});

	it("should group items by year, month, and day - multiple days", () => {
		const { budget, simple, recurrent } = getTestBudget({
			simple: 2,
			recurrent: [{}],
		});
		const budgetHistory = BudgetHistory.fromBudget(budget);

		const grouped = budgetHistory.getGroupedByYearMonthDay();

		expect(grouped).toEqual({
			2024: {
				Jan: {
					1: [
						...simple.map((item) => item.history).flat(),
						...recurrent
							.map((item) => item.history)
							.flat()
							.filter((item) => item.date.getDate() === 1),
					],
					2: [
						...recurrent
							.map((item) => item.history)
							.flat()
							.filter((item) => item.date.getDate() === 2),
					],
					3: [
						...recurrent
							.map((item) => item.history)
							.flat()
							.filter((item) => item.date.getDate() === 3),
					],
				},
			},
		});
	});
});

type TestBudgetConfig = {
	recurrent?: TestBudgetRecurrentConfig[];
	simple?: number;
};

type TestBudgetRecurrentConfig = {
	frequency?: string;
	nextDate?: Date;
};

export const getTestBudget = (config?: TestBudgetConfig) => {
	const { recurrent = 0, simple = 0 } = config || {};
	const budget = new Budget<BudgetItem>([]);
	const simpleItems: BudgetItemSimple[] = [];
	const recurrentItems: BudgetItemRecurrent[] = [];
	if (recurrent) {
		for (let itemConfig of recurrent) {
			const item = BudgetItemRecurrent.create(
				"test",
				"test",
				100,
				"test",
				"income",
				itemConfig.nextDate ?? new Date(2024, 0, 1),
				new FrequencyString(itemConfig.frequency ?? "1mo"),
				"test"
			);
			item.record(
				new Date(2024, 0, 1),
				"account",
				item.amount.toNumber()
			);
			item.record(
				new Date(2024, 0, 2),
				"account",
				item.amount.toNumber()
			);
			item.record(
				new Date(2024, 0, 3),
				"account",
				item.amount.toNumber()
			);
			recurrentItems.push(item);
		}
	}
	if (simple) {
		for (let i = 0; i < simple; i++) {
			const item = BudgetItemSimple.create(
				"account",
				"test",
				100,
				"test",
				"expense",
				new Date(2024, 0, 1)
			);
			simpleItems.push(item);
		}
	}
	budget.addItems(...simpleItems, ...recurrentItems);

	return { budget: budget, simple: simpleItems, recurrent: recurrentItems };
};
