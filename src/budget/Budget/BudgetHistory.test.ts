import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { Budget } from "./Budget";
import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { BudgetHistory } from "./BudgetHistory";
import { FrequencyString } from "budget/BudgetItem/FrequencyString";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";

describe("getBalance", () => {
	it("should return the correct balance for one simple item", () => {
		const budget = new Budget<BudgetItem>([]);
		const item = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2024-01-01"))
		);
		budget.addItems(item);
		const budgetHistory = BudgetHistory.fromBudget(budget, 0);

		const balance = budgetHistory.getBalance();

		expect(balance).toBe(100);
	});

	it("should return the correct balance for one recurrent item", () => {
		const budget = new Budget<BudgetItem>([]);
		const item = BudgetItemRecurrent.create(
			"test",
			100,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2024-01-01")),
			new FrequencyString("1mo"),
			"test"
		);
		item.record(new Date("2024-01-01"), "account", 100);
		budget.addItems(item);
		const budgetHistory = BudgetHistory.fromBudget(budget, 0);

		const balance = budgetHistory.getBalance();

		expect(balance).toBe(100);
	});

	it("should return the correct balance for multiple items", () => {
		const budget = new Budget<BudgetItem>([]);
		const item1 = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2024-01-01"))
		);
		const item2 = BudgetItemRecurrent.create(
			"test",
			70,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2024-01-01")),
			new FrequencyString("1mo"),
			"test"
		);
		item2.record(new Date("2024-01-01"), "account", 70);
		budget.addItems(item1, item2);
		const budgetHistory = BudgetHistory.fromBudget(budget, 0);

		const balance = budgetHistory.getBalance();

		expect(balance).toBe(170);
	});

	it("should return the correct balance for multiple items with negative amount", () => {
		const budget = new Budget<BudgetItem>([]);
		const item1 = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"expense",
			new BudgetItemNextDate(new Date("2024-01-01"))
		);
		const item2 = BudgetItemRecurrent.create(
			"test",
			70,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2024-01-01")),
			new FrequencyString("1mo"),
			"test"
		);
		item2.record(new Date("2024-01-01"), "account", 70);
		budget.addItems(item1, item2);
		const budgetHistory = BudgetHistory.fromBudget(budget, 0);

		const balance = budgetHistory.getBalance();

		expect(balance).toBe(-30);
	});

	it("should return the correct balance for multiple items with negative amount but positive initial balance", () => {
		const budget = new Budget<BudgetItem>([]);
		const item1 = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"expense",
			new BudgetItemNextDate(new Date("2024-01-01"))
		);
		const item2 = BudgetItemRecurrent.create(
			"test",
			70,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2024-01-01")),
			new FrequencyString("1mo"),
			"test"
		);
		item2.record(new Date("2024-01-01"), "account", 70);
		budget.addItems(item1, item2);
		const initialBalance = 100;
		const budgetHistory = BudgetHistory.fromBudget(budget, initialBalance);

		const balance = budgetHistory.getBalance();

		expect(balance).toBe(70);
	});

	it("should return the correct balance for one simple item with until date", () => {
		const budget = new Budget<BudgetItem>([]);
		const item1 = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"expense",
			new BudgetItemNextDate(new Date("2024-01-01"))
		);
		const item2 = BudgetItemRecurrent.create(
			"test",
			70,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2024-01-02")),
			new FrequencyString("1mo"),
			"test"
		);
		budget.addItems(item1, item2);
		const untilDate = new Date("2024-01-01");
		const budgetHistory = BudgetHistory.fromBudget(budget, 0);

		const balance = budgetHistory.getBalance({ untilDate: untilDate });

		expect(balance).toBe(-100);
	});

	it("should return the correct balance for one recurrent item with until date", () => {
		const budget = new Budget<BudgetItem>([]);
		const item1 = BudgetItemSimple.create(
			"account",
			"test",
			100,
			"test",
			"expense",
			new BudgetItemNextDate(new Date("2024-01-02"))
		);
		const item2 = BudgetItemRecurrent.create(
			"test",
			70,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2024-01-01")),
			new FrequencyString("1mo"),
			"test"
		);
		item2.record(new Date("2024-01-01"), "account", 70);
		budget.addItems(item1, item2);
		const untilDate = new Date("2024-01-01");
		const budgetHistory = BudgetHistory.fromBudget(budget, 0);

		const balance = budgetHistory.getBalance({ untilDate: untilDate });

		expect(balance).toBe(70);
	});
});
