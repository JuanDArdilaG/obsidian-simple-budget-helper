import { DateValueObject, PriceValueObject } from "@juandardilag/value-objects";
import { describe, expect, it } from "vitest";
import {
	Account,
	AccountAssetSubtype,
	AccountBalance,
	AccountName,
	AccountType,
} from "../../../../src/contexts/Accounts/domain";
import { Currency } from "../../../../src/contexts/Currencies/domain/currency.vo";
import { ScheduledMonthlyReport } from "../../../../src/contexts/Reports/domain/scheduled-monthly-report.entity";
import { ItemOperation } from "../../../../src/contexts/Shared/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
import { buildTestItems } from "../../Items/domain/buildTestItems";

describe("ItemsReport", () => {
	describe("basic filtering methods", () => {
		it("should filter only expenses", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, operation: ItemOperation.expense() },
				{ account, operation: ItemOperation.income() },
				{ account, operation: ItemOperation.expense() },
			]);
			const report = new ScheduledMonthlyReport(items, [account]);

			const expensesReport = report.onlyExpenses();
			expect(
				expensesReport.scheduledTransactionsWithAccounts,
			).toHaveLength(2);
			expensesReport.scheduledTransactionsWithAccounts.forEach(
				({ scheduledTransaction }) => {
					expect(
						scheduledTransaction.operation.type.isExpense(),
					).toBe(true);
				},
			);
		});

		it("should filter only incomes", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, operation: ItemOperation.expense() },
				{ account, operation: ItemOperation.income() },
				{ account, operation: ItemOperation.income() },
			]);
			const report = new ScheduledMonthlyReport(items, [account]);
			const incomesReport = report.onlyIncomes();
			expect(
				incomesReport.scheduledTransactionsWithAccounts,
			).toHaveLength(2);
			incomesReport.scheduledTransactionsWithAccounts.forEach(
				({ scheduledTransaction }) => {
					expect(scheduledTransaction.operation.type.isIncome()).toBe(
						true,
					);
				},
			);
		});

		it("should filter only infinite recurrent items", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, recurrence: { frequency: "monthly" } }, // infinite
				{
					account,
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
				{ account, recurrence: { frequency: "monthly" } }, // infinite
			]);
			const report = new ScheduledMonthlyReport(items, [account]);

			const infiniteReport = report.onlyInfiniteRecurrent();
			expect(
				infiniteReport.scheduledTransactionsWithAccounts,
			).toHaveLength(2);
			infiniteReport.scheduledTransactionsWithAccounts.forEach(
				({ scheduledTransaction }) => {
					expect(
						scheduledTransaction.recurrencePattern.totalOccurrences,
					).toBe(-1);
				},
			);
		});

		it("should filter only finite recurrent items", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, recurrence: { frequency: "monthly" } }, // infinite
				{
					account,
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
				{
					account,
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
			]);
			const report = new ScheduledMonthlyReport(items, [account]);

			const finiteReport = report.onlyFiniteRecurrent();
			expect(finiteReport.scheduledTransactionsWithAccounts).toHaveLength(
				2,
			);
			finiteReport.scheduledTransactionsWithAccounts.forEach(
				({ scheduledTransaction }) => {
					expect(
						scheduledTransaction.recurrencePattern.totalOccurrences,
					).not.toBe(-1);
				},
			);
		});
	});

	describe("getter methods", () => {
		it("should get expense items", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, operation: ItemOperation.expense() },
				{ account, operation: ItemOperation.income() },
				{ account, operation: ItemOperation.expense() },
			]);
			const report = new ScheduledMonthlyReport(items, [account]);

			const expenseItems = report.getExpenseItems();
			expect(expenseItems).toHaveLength(2);
			expenseItems.forEach((item) => {
				expect(item.operation.type.isExpense()).toBe(true);
			});
		});

		it("should get income items", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, operation: ItemOperation.expense() },
				{ account, operation: ItemOperation.income() },
				{ account, operation: ItemOperation.income() },
			]);
			const report = new ScheduledMonthlyReport(items, [account]);

			const incomeItems = report.getIncomeItems();
			expect(incomeItems).toHaveLength(2);
			incomeItems.forEach((item) => {
				expect(item.operation.type.isIncome()).toBe(true);
			});
		});

		it("should get transfer items", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, operation: ItemOperation.expense() },
				{ account, operation: ItemOperation.transfer() },
				{ account, operation: ItemOperation.income() },
				{ account, operation: ItemOperation.transfer() },
			]);
			const report = new ScheduledMonthlyReport(items, [account]);

			const transferItems = report.getTransferItems();
			expect(transferItems).toHaveLength(2);
			transferItems.forEach((item) => {
				expect(item.operation.type.isTransfer()).toBe(true);
			});
		});

		it("should get finite recurrent items", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, recurrence: { frequency: "monthly" } }, // infinite
				{
					account,
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
				{
					account,
					recurrence: {
						frequency: "monthly",
						untilDate: DateValueObject.createNowDate(),
					},
				}, // finite
			]);
			const report = new ScheduledMonthlyReport(items, [account]);

			const finiteItems = report.getFiniteRecurrentItems();
			expect(finiteItems).toHaveLength(2);
			finiteItems.forEach((item) => {
				expect(item.recurrencePattern.totalOccurrences).not.toBe(-1);
			});
		});
	});

	describe("total calculations", () => {
		it("should calculate total correctly", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, price: new PriceValueObject(100) },
				{ account, price: new PriceValueObject(200) },
				{ account, price: new PriceValueObject(300) },
			]);
			const report = new ScheduledMonthlyReport(items, [account]);
			const total = report.getTotal();
			expect(total.value).toBe(-600);
		});

		it("should calculate total per month correctly", () => {
			const items = buildTestItems([
				{ price: new PriceValueObject(100) },
				{ price: new PriceValueObject(200) },
				{ price: new PriceValueObject(300) },
			]);
			const report = new ScheduledMonthlyReport(
				items,
				items.map(
					(item) =>
						new Account(
							item.originAccounts[0].account.id,
							AccountType.asset(),
							AccountAssetSubtype.CHECKING,
							new AccountName("Test Account"),
							new Currency("USD"),
							AccountBalance.zero(),
							DateValueObject.createNowDate(),
						),
				),
			);

			const totalPerMonth = report.getTotalPerMonth();
			expect(totalPerMonth.value).toBe(-600);
		});
	});

	describe("complex filtering scenarios", () => {
		it("should handle mixed item types correctly", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, operation: ItemOperation.expense() },
				{ account, operation: ItemOperation.income() },
				{ account, operation: ItemOperation.transfer() },
				{ account, operation: ItemOperation.expense() },
			]);
			const report = new ScheduledMonthlyReport(items, [account]);

			expect(report.getExpenseItems()).toHaveLength(2);
			expect(report.getIncomeItems()).toHaveLength(1);
			expect(report.getTransferItems()).toHaveLength(1);
		});
	});

	describe("transfer filtering edge cases", () => {
		it("should correctly identify transfer items", () => {
			const account = buildTestAccounts(1)[0];
			const items = buildTestItems([
				{ account, operation: ItemOperation.transfer() },
				{ account, operation: ItemOperation.transfer() },
				{ account, operation: ItemOperation.expense() },
			]);
			const report = new ScheduledMonthlyReport(items, [account]);

			const transferItems = report.getTransferItems();
			expect(transferItems).toHaveLength(2);
			transferItems.forEach((item) => {
				expect(item.operation.type.isTransfer()).toBe(true);
				expect(item.destinationAccounts[0]?.account.id).toBeDefined();
			});
		});
	});
});
