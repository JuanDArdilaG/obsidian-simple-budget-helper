import { StringValueObject } from "@juandardilag/value-objects";
import { Category, CategoryName } from "contexts/Categories/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategory, SubCategoryName } from "contexts/Subcategories/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { describe, expect, it } from "vitest";
import {
	ItemRecurrenceFrequency,
	RecurrencePattern,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { TransactionCategory } from "../../../../src/contexts/Transactions/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

describe("EditItemRecurrencePanel Logic", () => {
	it("should identify single recurrence items correctly", () => {
		// Create a single recurrence item (one-time)
		const singleRecurrenceDate = new ScheduledTransactionDate(
			new Date("2024-01-15"),
		);
		const cat = Category.create(new CategoryName("Food"));
		const accounts = buildTestAccounts(2);
		const singleRecurrenceItem = ScheduledTransaction.create(
			new StringValueObject("Single Item"),
			RecurrencePattern.oneTime(singleRecurrenceDate),
			[new AccountSplit(accounts[0], new TransactionAmount(100))],
			[new AccountSplit(accounts[1], new TransactionAmount(100))],
			ItemOperation.expense(),
			new TransactionCategory(
				cat,
				SubCategory.create(cat.id, new SubCategoryName("Groceries")),
			),
		);

		// Create a recurring item
		const recurringStartDate = new ScheduledTransactionDate(
			new Date("2024-01-01"),
		);
		const recurringItem = ScheduledTransaction.create(
			new StringValueObject("Recurring Item"),
			RecurrencePattern.infinite(
				recurringStartDate,
				new ItemRecurrenceFrequency("monthly"),
			),
			[new AccountSplit(accounts[0], new TransactionAmount(50))],
			[new AccountSplit(accounts[1], new TransactionAmount(50))],
			ItemOperation.expense(),
			new TransactionCategory(
				cat,
				SubCategory.create(cat.id, new SubCategoryName("Dining Out")),
			),
		);

		expect(singleRecurrenceItem.recurrencePattern.isOneTime).toBe(true);
		expect(recurringItem.recurrencePattern.isOneTime).toBe(false);
	});
});
