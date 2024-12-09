import { Budget } from "./Budget";
import { BudgetItem } from "./BudgetItem";

describe("Budget", () => {
	it("should calculate total to TODAY date correctly", () => {
		const now = new Date("2024-01-01");
		const today = new Date("2024-01-01");
		const budget = new Budget([
			new BudgetItem("Item 1", 100, "Category 1", today, "1d"),
			new BudgetItem("Item 2", 200, "Category 2", today, "2d"),
			new BudgetItem("Item 3", 300, "Category 3", today, "3d"),
		]);

		const total = budget.getTotalToDate(today, now);

		expect(total).toBe(0);
	});

	it("should calculate total to TOMORROW date correctly", () => {
		const now = new Date("2024-01-01");
		const tomorrow = new Date("2024-01-02");
		const budget = new Budget([
			new BudgetItem("Item 1", 100, "Category 1", tomorrow, "1d"),
			new BudgetItem("Item 2", 200, "Category 2", tomorrow, "2d"),
			new BudgetItem("Item 3", 300, "Category 3", tomorrow, "3d"),
		]);

		const total = budget.getTotalToDate(tomorrow, now);

		expect(total).toBe(300);
	});

	it("should calculate total to YESTERDAY date correctly", () => {
		const now = new Date("2024-01-01");
		const yesterday = new Date("2023-12-31");
		const budget = new Budget([
			new BudgetItem("Item 1", 100, "Category 1", yesterday, "1d"),
			new BudgetItem("Item 2", 200, "Category 2", yesterday, "2d"),
			new BudgetItem("Item 3", 300, "Category 3", yesterday, "3d"),
		]);

		const total = budget.getTotalToDate(yesterday, now);

		expect(total).toBe(0);
	});

	it("should calculate total to A 31 DAYS MONTH date correctly", () => {
		const now = new Date("2024-01-01");
		const aMonth = new Date("2024-02-01");
		const budget = new Budget([
			new BudgetItem("Item 1", 100, "Category 1", aMonth, "1d"),
			new BudgetItem("Item 2", 200, "Category 2", aMonth, "2d"),
			new BudgetItem("Item 3", 300, "Category 3", aMonth, "3d"),
		]);

		const total = budget.getTotalToDate(aMonth, now);

		expect(total).toBe(9300);
	});

	it("should calculate total to A 30 DAYS MONTH date correctly", () => {
		const now = new Date("2024-04-01");
		const aMonth = new Date("2024-05-01");
		const budget = new Budget([
			new BudgetItem("Item 1", 100, "Category 1", aMonth, "1d"),
			new BudgetItem("Item 2", 200, "Category 2", aMonth, "2d"),
			new BudgetItem("Item 3", 300, "Category 3", aMonth, "3d"),
		]);

		const total = budget.getTotalToDate(aMonth, now);

		expect(total).toBe(9000);
	});
});
