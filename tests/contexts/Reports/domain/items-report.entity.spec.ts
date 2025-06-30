import { DateValueObject } from "@juandardilag/value-objects";
import { describe, expect, it } from "vitest";
import { AccountID } from "../../../../src/contexts/Accounts/domain";
import { ItemPrice } from "../../../../src/contexts/Items/domain";
import { ItemsReport } from "../../../../src/contexts/Reports/domain/items-report.entity";
import { ItemOperation } from "../../../../src/contexts/Shared/domain";
import { buildTestItems } from "../../Items/domain/buildTestItems";

describe("ItemsReport", () => {
	describe("basic filtering methods", () => {
		it("should filter only expenses", () => {
			const items = buildTestItems([
				{ operation: ItemOperation.expense() },
				{ operation: ItemOperation.income() },
				{ operation: ItemOperation.expense() },
			]);
			const report = new ItemsReport(items);

			const expensesReport = report.onlyExpenses();
			expect(expensesReport.items).toHaveLength(2);
			expensesReport.items.forEach((item) => {
				expect(item.operation.type.isExpense()).toBe(true);
			});
		});

		it("should filter only incomes", () => {
			const items = buildTestItems([
				{ operation: ItemOperation.expense() },
				{ operation: ItemOperation.income() },
				{ operation: ItemOperation.income() },
			]);
			const report = new ItemsReport(items);

			const incomesReport = report.onlyIncomes();
			expect(incomesReport.items).toHaveLength(2);
			incomesReport.items.forEach((item) => {
				expect(item.operation.type.isIncome()).toBe(true);
			});
		});

		it("should filter only infinite recurrent items", () => {
			const items = buildTestItems([
				{ recurrence: { frequency: "monthly" } }, // infinite
				{
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
				{ recurrence: { frequency: "monthly" } }, // infinite
			]);
			const report = new ItemsReport(items);

			const infiniteReport = report.onlyInfiniteRecurrent();
			expect(infiniteReport.items).toHaveLength(2);
			infiniteReport.items.forEach((item) => {
				expect(item.recurrence?.totalRecurrences).toBe(-1);
			});
		});

		it("should filter only finite recurrent items", () => {
			const items = buildTestItems([
				{ recurrence: { frequency: "monthly" } }, // infinite
				{
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
				{
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
			]);
			const report = new ItemsReport(items);

			const finiteReport = report.onlyFiniteRecurrent();
			expect(finiteReport.items).toHaveLength(2);
			finiteReport.items.forEach((item) => {
				expect(item.recurrence?.totalRecurrences).not.toBe(-1);
			});
		});
	});

	describe("getter methods", () => {
		it("should get expense items", () => {
			const items = buildTestItems([
				{ operation: ItemOperation.expense() },
				{ operation: ItemOperation.income() },
				{ operation: ItemOperation.expense() },
			]);
			const report = new ItemsReport(items);

			const expenseItems = report.getExpenseItems();
			expect(expenseItems).toHaveLength(2);
			expenseItems.forEach((item) => {
				expect(item.operation.type.isExpense()).toBe(true);
			});
		});

		it("should get income items", () => {
			const items = buildTestItems([
				{ operation: ItemOperation.expense() },
				{ operation: ItemOperation.income() },
				{ operation: ItemOperation.income() },
			]);
			const report = new ItemsReport(items);

			const incomeItems = report.getIncomeItems();
			expect(incomeItems).toHaveLength(2);
			incomeItems.forEach((item) => {
				expect(item.operation.type.isIncome()).toBe(true);
			});
		});

		it("should get transfer items", () => {
			const account1 = AccountID.generate();
			const account2 = AccountID.generate();
			const items = buildTestItems([
				{ operation: ItemOperation.expense() },
				{ operation: ItemOperation.transfer() },
				{ operation: ItemOperation.income() },
				{ operation: ItemOperation.transfer() },
			]);
			const report = new ItemsReport(items);

			const transferItems = report.getTransferItems();
			expect(transferItems).toHaveLength(2);
			transferItems.forEach((item) => {
				expect(item.operation.type.isTransfer()).toBe(true);
			});
		});

		it("should get infinite recurrent items", () => {
			const items = buildTestItems([
				{ recurrence: { frequency: "monthly" } }, // infinite
				{
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
				{ recurrence: { frequency: "monthly" } }, // infinite
			]);
			const report = new ItemsReport(items);

			const infiniteItems = report.getInfiniteRecurrentItems();
			expect(infiniteItems).toHaveLength(2);
			infiniteItems.forEach((item) => {
				expect(item.recurrence?.totalRecurrences).toBe(-1);
			});
		});

		it("should get finite recurrent items", () => {
			const items = buildTestItems([
				{ recurrence: { frequency: "monthly" } }, // infinite
				{
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
				{
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
			]);
			const report = new ItemsReport(items);

			const finiteItems = report.getFiniteRecurrentItems();
			expect(finiteItems).toHaveLength(2);
			finiteItems.forEach((item) => {
				expect(item.recurrence?.totalRecurrences).not.toBe(-1);
			});
		});
	});

	describe("total calculations", () => {
		it("should calculate total correctly", () => {
			const items = buildTestItems([
				{ price: new ItemPrice(100) },
				{ price: new ItemPrice(200) },
				{ price: new ItemPrice(300) },
			]);
			const report = new ItemsReport(items);

			const total = report.getTotal();
			expect(total.value).toBe(-600);
		});

		it("should calculate total per month correctly", () => {
			const items = buildTestItems([
				{ price: new ItemPrice(100) },
				{ price: new ItemPrice(200) },
				{ price: new ItemPrice(300) },
			]);
			const report = new ItemsReport(items);

			const totalPerMonth = report.getTotalPerMonth();
			expect(totalPerMonth.value).toBe(-600);
		});

		it("should get years from recurrences", () => {
			const items = buildTestItems([
				{ recurrence: { frequency: "monthly" } },
				{ recurrence: { frequency: "monthly" } },
				{ recurrence: { frequency: "monthly" } },
			]);
			const report = new ItemsReport(items);

			const years = report.getYears();
			expect(years).toContain(new Date().getFullYear());
		});
	});

	describe("complex filtering scenarios", () => {
		it("should handle mixed item types correctly", () => {
			const account1 = AccountID.generate();
			const account2 = AccountID.generate();
			const items = buildTestItems([
				{ operation: ItemOperation.expense() },
				{ operation: ItemOperation.income() },
				{ operation: ItemOperation.transfer() },
				{ operation: ItemOperation.expense() },
			]);
			const report = new ItemsReport(items);

			expect(report.getExpenseItems()).toHaveLength(2);
			expect(report.getIncomeItems()).toHaveLength(1);
			expect(report.getTransferItems()).toHaveLength(1);
		});

		it("should handle mixed recurrence types correctly", () => {
			const items = buildTestItems([
				{ recurrence: { frequency: "monthly" } }, // infinite
				{
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
				{ recurrence: { frequency: "monthly" } }, // infinite
				{
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
			]);
			const report = new ItemsReport(items);

			expect(report.getInfiniteRecurrentItems()).toHaveLength(2);
			expect(report.getFiniteRecurrentItems()).toHaveLength(2);
		});

		it("should handle empty items array", () => {
			const report = new ItemsReport([]);

			expect(report.getExpenseItems()).toHaveLength(0);
			expect(report.getIncomeItems()).toHaveLength(0);
			expect(report.getTransferItems()).toHaveLength(0);
			expect(report.getInfiniteRecurrentItems()).toHaveLength(0);
			expect(report.getFiniteRecurrentItems()).toHaveLength(0);
			expect(report.getTotal().value).toBe(0);
			expect(report.getTotalPerMonth().value).toBe(0);
		});
	});

	describe("transfer filtering edge cases", () => {
		it("should correctly identify transfer items", () => {
			const account1 = AccountID.generate();
			const account2 = AccountID.generate();
			const items = buildTestItems([
				{ operation: ItemOperation.transfer() },
				{ operation: ItemOperation.transfer() },
				{ operation: ItemOperation.expense() },
			]);
			const report = new ItemsReport(items);

			const transferItems = report.getTransferItems();
			expect(transferItems).toHaveLength(2);
			transferItems.forEach((item) => {
				expect(item.operation.type.isTransfer()).toBe(true);
				expect(item.toSplits[0]?.accountId).toBeDefined();
			});
		});

		it("should handle items without recurrence", () => {
			const items = buildTestItems([
				{}, // one-time item
				{ recurrence: { frequency: "monthly" } }, // infinite
				{
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
			]);
			const report = new ItemsReport(items);

			// One-time items should be considered finite (totalRecurrences = 1)
			const finiteItems = report.getFiniteRecurrentItems();
			expect(finiteItems).toHaveLength(2); // one-time + finite

			const infiniteItems = report.getInfiniteRecurrentItems();
			expect(infiniteItems).toHaveLength(1);
		});
	});

	describe("integration with component logic", () => {
		it("should provide correct building blocks for component filtering", () => {
			const account1 = AccountID.generate();
			const account2 = AccountID.generate();
			const items = buildTestItems([
				// Infinite recurrent expense
				{
					operation: ItemOperation.expense(),
					recurrence: { frequency: "monthly" },
				},
				// Finite recurrent expense
				{
					operation: ItemOperation.expense(),
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				},
				// Infinite recurrent transfer (Asset to Liability)
				{
					operation: ItemOperation.transfer(),
					recurrence: { frequency: "monthly" },
				},
				// Income
				{
					operation: ItemOperation.income(),
					recurrence: { frequency: "monthly" },
				},
			]);
			const report = new ItemsReport(items);

			// These should provide the building blocks for component filtering
			const expenseItems = report.getExpenseItems();
			const transferItems = report.getTransferItems();
			const infiniteItems = report.getInfiniteRecurrentItems();
			const finiteItems = report.getFiniteRecurrentItems();
			const incomeItems = report.getIncomeItems();

			expect(expenseItems).toHaveLength(2);
			expect(transferItems).toHaveLength(1);
			expect(infiniteItems).toHaveLength(3);
			expect(finiteItems).toHaveLength(1);
			expect(incomeItems).toHaveLength(1);
		});
	});
});
