import { DateValueObject, PriceValueObject } from "@juandardilag/value-objects";
import { describe, expect, it } from "vitest";
import { ItemsReport } from "../../../../src/contexts/Reports/domain/scheduled-transactions-report.entity";
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
				expect(item.recurrencePattern.totalOccurrences).toBe(-1);
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
				expect(item.recurrencePattern.totalOccurrences).not.toBe(-1);
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
				expect(item.recurrencePattern.totalOccurrences).not.toBe(-1);
			});
		});
	});

	describe("total calculations", () => {
		it("should calculate total correctly", () => {
			const items = buildTestItems([
				{ price: new PriceValueObject(100) },
				{ price: new PriceValueObject(200) },
				{ price: new PriceValueObject(300) },
			]);
			const report = new ItemsReport(items);

			const total = report.getTotal();
			expect(total.value).toBe(-600);
		});

		it("should calculate total per month correctly", () => {
			const items = buildTestItems([
				{ price: new PriceValueObject(100) },
				{ price: new PriceValueObject(200) },
				{ price: new PriceValueObject(300) },
			]);
			const report = new ItemsReport(items);

			const totalPerMonth = report.getTotalPerMonth();
			expect(totalPerMonth.value).toBe(-600);
		});
	});

	describe("complex filtering scenarios", () => {
		it("should handle mixed item types correctly", () => {
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
	});

	describe("transfer filtering edge cases", () => {
		it("should correctly identify transfer items", () => {
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
	});
});
