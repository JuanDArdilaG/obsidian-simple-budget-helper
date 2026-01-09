import { DateValueObject } from "@juandardilag/value-objects";
import { Account, AccountName, AccountType } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { ItemName, ScheduledItem } from "contexts/Items/domain";
import { ItemRecurrenceFrequency } from "contexts/Items/domain/item-recurrence-frequency.valueobject";
import { ReportsService } from "contexts/Reports/application/reports.service";
import { ItemsReport } from "contexts/Reports/domain/scheduled-transactions-report.entity";
import { ItemOperation } from "contexts/Shared/domain/Item/item-operation.valueobject";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { beforeEach, describe, expect, it } from "vitest";
import { AccountsServiceMock } from "../../Accounts/application/accounts-service.mock";

// Helper for PaymentSplit
const split = (account: Account, amount: number): PaymentSplit =>
	new PaymentSplit(account.id, new TransactionAmount(amount));

describe("ReportsService.getTotalPerMonth", () => {
	let reportsService: ReportsService;
	let assetAccount: Account;
	let liabilityAccount: Account;
	let categoryId: CategoryID;
	let subCategoryId: SubCategoryID;
	let startDate: DateValueObject;

	beforeEach(() => {
		assetAccount = Account.create(
			AccountType.asset(),
			new AccountName("Bank Account")
		);
		liabilityAccount = Account.create(
			AccountType.liability(),
			new AccountName("Credit Card")
		);
		const accountsService = new AccountsServiceMock([
			assetAccount,
			liabilityAccount,
		]);
		reportsService = new ReportsService(accountsService);
		categoryId = CategoryID.generate();
		subCategoryId = SubCategoryID.generate();
		startDate = DateValueObject.createNowDate();
	});

	describe("Income transactions", () => {
		it("should calculate total for income transactions correctly", async () => {
			const incomeItem1 = ScheduledItem.oneTime(
				startDate,
				new ItemName("Salary"),
				[split(assetAccount, 5000)],
				[],
				ItemOperation.income(),
				categoryId,
				subCategoryId
			);
			const incomeItem2 = ScheduledItem.oneTime(
				startDate,
				new ItemName("Bonus"),
				[split(assetAccount, 1000)],
				[],
				ItemOperation.income(),
				categoryId,
				subCategoryId
			);
			const report = new ItemsReport([incomeItem1, incomeItem2]);
			const result = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(result.value).toBe(6000);
		});
		it("should calculate total for recurring income correctly", async () => {
			const recurringIncome = ScheduledItem.infinite(
				startDate,
				new ItemName("Monthly Salary"),
				[split(assetAccount, 3000)],
				[],
				ItemOperation.income(),
				categoryId,
				subCategoryId,
				new ItemRecurrenceFrequency("1mo")
			);

			const report = new ItemsReport([recurringIncome]);
			const result = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);

			// Monthly recurring income should be 3000
			expect(result.value).toBe(3000);
		});
	});

	describe("Expense transactions", () => {
		it("should calculate total for expense transactions correctly", async () => {
			const expenseItem1 = ScheduledItem.oneTime(
				startDate,
				new ItemName("Groceries"),
				[split(assetAccount, 200)],
				[],
				ItemOperation.expense(),
				categoryId,
				subCategoryId
			);
			const expenseItem2 = ScheduledItem.oneTime(
				startDate,
				new ItemName("Gas"),
				[split(assetAccount, 50)],
				[],
				ItemOperation.expense(),
				categoryId,
				subCategoryId
			);
			const report = new ItemsReport([expenseItem1, expenseItem2]);
			const result = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(result.value).toBe(-250);
		});

		it("should calculate total for recurring expenses correctly", async () => {
			const recurringExpense = ScheduledItem.infinite(
				startDate,
				new ItemName("Rent"),
				[split(assetAccount, 1200)],
				[],
				ItemOperation.expense(),
				categoryId,
				subCategoryId,
				new ItemRecurrenceFrequency("1mo")
			);
			const report = new ItemsReport([recurringExpense]);
			const result = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(result.value).toBe(-1200);
		});
	});

	describe("Transfer transactions", () => {
		it("should calculate total for asset to liability transfers correctly", async () => {
			const transferItem = ScheduledItem.oneTime(
				startDate,
				new ItemName("Credit Card Payment"),
				[split(assetAccount, 500)],
				[split(liabilityAccount, 500)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);
			const report = new ItemsReport([transferItem]);
			const expensesResult = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(expensesResult.value).toBe(-500);
			const incomesResult = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(incomesResult.value).toBe(0);
		});
		it("should calculate total for liability to asset transfers correctly", async () => {
			const transferItem = ScheduledItem.oneTime(
				startDate,
				new ItemName("Credit Card Withdrawal"),
				[split(liabilityAccount, 300)],
				[split(assetAccount, 300)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);
			const report = new ItemsReport([transferItem]);
			const expensesResult = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(expensesResult.value).toBe(0);
			const incomesResult = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(incomesResult.value).toBe(300);
		});
		it("should calculate total for asset to asset transfers correctly", async () => {
			const savingsAccount = Account.create(
				AccountType.asset(),
				new AccountName("Savings")
			);
			const mockAccountsService = new AccountsServiceMock([
				assetAccount,
				liabilityAccount,
				savingsAccount,
			]);
			const reportsServiceWithSavings = new ReportsService(
				mockAccountsService
			);

			const transferItem = ScheduledItem.oneTime(
				startDate,
				new ItemName("Transfer to Savings"),
				[split(assetAccount, 1000)],
				[split(savingsAccount, 1000)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);
			const report = new ItemsReport([transferItem]);
			const expensesResult =
				await reportsServiceWithSavings.getTotalPerMonth(
					report,
					"expenses"
				);
			expect(expensesResult.value).toBe(0);
			const incomesResult =
				await reportsServiceWithSavings.getTotalPerMonth(
					report,
					"incomes"
				);
			expect(incomesResult.value).toBe(0);
		});
	});

	describe("Mixed transactions", () => {
		it("should calculate total for mixed income and expense transactions", async () => {
			const incomeItem = ScheduledItem.oneTime(
				startDate,
				new ItemName("Salary"),
				[split(assetAccount, 4000)],
				[],
				ItemOperation.income(),
				categoryId,
				subCategoryId
			);
			const expenseItem = ScheduledItem.oneTime(
				startDate,
				new ItemName("Rent"),
				[split(assetAccount, 1500)],
				[],
				ItemOperation.expense(),
				categoryId,
				subCategoryId
			);
			const report = new ItemsReport([incomeItem, expenseItem]);
			const incomesResult = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(incomesResult.value).toBe(4000);
			const expensesResult = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(expensesResult.value).toBe(-1500);
			const allResult = await reportsService.getTotalPerMonth(
				report,
				"all"
			);
			expect(allResult.value).toBe(2500);
		});

		it("should calculate total for complex scenario with all transaction types", async () => {
			const incomeItem = ScheduledItem.oneTime(
				startDate,
				new ItemName("Salary"),
				[split(assetAccount, 5000)],
				[],
				ItemOperation.income(),
				categoryId,
				subCategoryId
			);
			const expenseItem = ScheduledItem.oneTime(
				startDate,
				new ItemName("Groceries"),
				[split(assetAccount, 300)],
				[],
				ItemOperation.expense(),
				categoryId,
				subCategoryId
			);
			const assetToLiabilityTransfer = ScheduledItem.oneTime(
				startDate,
				new ItemName("Credit Card Payment"),
				[split(assetAccount, 500)],
				[split(liabilityAccount, 500)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);
			const liabilityToAssetTransfer = ScheduledItem.oneTime(
				startDate,
				new ItemName("Credit Card Withdrawal"),
				[split(liabilityAccount, 200)],
				[split(assetAccount, 200)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);
			const report = new ItemsReport([
				incomeItem,
				expenseItem,
				assetToLiabilityTransfer,
				liabilityToAssetTransfer,
			]);
			const incomesResult = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(incomesResult.value).toBe(5200);
			const expensesResult = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(expensesResult.value).toBe(-800);
			const allResult = await reportsService.getTotalPerMonth(
				report,
				"all"
			);
			expect(allResult.value).toBe(4400); // 5000 - 300 - 500 + 200
		});

		it("should handle recurring and one-time transactions correctly", async () => {
			const recurringIncome = ScheduledItem.infinite(
				startDate,
				new ItemName("Monthly Salary"),
				[split(assetAccount, 4000)],
				[],
				ItemOperation.income(),
				categoryId,
				subCategoryId,
				new ItemRecurrenceFrequency("1mo")
			);

			const oneTimeExpense = ScheduledItem.oneTime(
				startDate,
				new ItemName("Car Repair"),
				[split(assetAccount, 800)],
				[],
				ItemOperation.expense(),
				categoryId,
				subCategoryId
			);

			const recurringExpense = ScheduledItem.infinite(
				startDate,
				new ItemName("Monthly Rent"),
				[split(assetAccount, 1200)],
				[],
				ItemOperation.expense(),
				categoryId,
				subCategoryId,
				new ItemRecurrenceFrequency("1mo")
			);

			const report = new ItemsReport([
				recurringIncome,
				oneTimeExpense,
				recurringExpense,
			]);

			// Test incomes only
			const incomesResult = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(incomesResult.value).toBe(4000);

			// Test expenses only
			const expensesResult = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(expensesResult.value).toBe(-2000); // -800 - 1200

			// Test all transactions
			const allResult = await reportsService.getTotalPerMonth(
				report,
				"all"
			);
			expect(allResult.value).toBe(2000); // 4000 - 800 - 1200
		});
	});

	describe("Edge cases", () => {
		it("should handle zero amount transactions", async () => {
			const zeroIncome = ScheduledItem.oneTime(
				startDate,
				new ItemName("Zero Income"),
				[split(assetAccount, 0)],
				[],
				ItemOperation.income(),
				categoryId,
				subCategoryId
			);

			const zeroExpense = ScheduledItem.oneTime(
				startDate,
				new ItemName("Zero Expense"),
				[split(assetAccount, 0)],
				[],
				ItemOperation.expense(),
				categoryId,
				subCategoryId
			);

			const report = new ItemsReport([zeroIncome, zeroExpense]);

			const incomesResult = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(incomesResult.value).toBe(0);

			const expensesResult = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(expensesResult.value).toBe(0);

			const allResult = await reportsService.getTotalPerMonth(
				report,
				"all"
			);
			expect(allResult.value).toBe(0);
		});

		it("should handle empty report", async () => {
			const report = new ItemsReport([]);

			const incomesResult = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(incomesResult.value).toBe(0);

			const expensesResult = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(expensesResult.value).toBe(0);

			const allResult = await reportsService.getTotalPerMonth(
				report,
				"all"
			);
			expect(allResult.value).toBe(0);
		});

		it("should handle different recurrence frequencies correctly", async () => {
			// Weekly income
			const weeklyIncome = ScheduledItem.infinite(
				startDate,
				new ItemName("Weekly Allowance"),
				[split(assetAccount, 100)],
				[],
				ItemOperation.income(),
				categoryId,
				subCategoryId,
				new ItemRecurrenceFrequency("1w")
			);

			// Yearly expense
			const yearlyExpense = ScheduledItem.infinite(
				startDate,
				new ItemName("Yearly Insurance"),
				[split(assetAccount, 1200)],
				[],
				ItemOperation.expense(),
				categoryId,
				subCategoryId,
				new ItemRecurrenceFrequency("1y")
			);

			const report = new ItemsReport([weeklyIncome, yearlyExpense]);

			// Test incomes only
			const incomesResult = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			// Weekly income should be converted to monthly: 100 * (30.4167 / 7) ≈ 434.52
			expect(incomesResult.value).toBeCloseTo(434.52, 1);

			// Test expenses only
			const expensesResult = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			// Yearly expense should be converted to monthly: 1200 / 12 = 100
			expect(expensesResult.value).toBeCloseTo(-100, 1);
		});

		it("should handle complex transfer scenarios", async () => {
			// Create multiple accounts for complex transfer testing
			const checkingAccount = Account.create(
				AccountType.asset(),
				new AccountName("Checking")
			);
			const savingsAccount = Account.create(
				AccountType.asset(),
				new AccountName("Savings")
			);
			const creditCard = Account.create(
				AccountType.liability(),
				new AccountName("Credit Card")
			);
			const loan = Account.create(
				AccountType.liability(),
				new AccountName("Loan")
			);

			const mockAccountsService = new AccountsServiceMock([
				checkingAccount,
				savingsAccount,
				creditCard,
				loan,
			]);
			const reportsServiceComplex = new ReportsService(
				mockAccountsService
			);

			// Asset to Asset transfer (should not be counted)
			const checkingToSavings = ScheduledItem.oneTime(
				startDate,
				new ItemName("Transfer to Savings"),
				[split(checkingAccount, 500)],
				[split(savingsAccount, 500)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);

			// Asset to Liability transfer (should be counted as expense)
			const checkingToCreditCard = ScheduledItem.oneTime(
				startDate,
				new ItemName("Credit Card Payment"),
				[split(checkingAccount, 300)],
				[split(creditCard, 300)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);

			// Liability to Asset transfer (should be counted as income)
			const creditCardToChecking = ScheduledItem.oneTime(
				startDate,
				new ItemName("Credit Card Withdrawal"),
				[split(creditCard, 200)],
				[split(checkingAccount, 200)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);

			// Liability to Liability transfer (should not be counted)
			const creditCardToLoan = ScheduledItem.oneTime(
				startDate,
				new ItemName("Debt Consolidation"),
				[split(creditCard, 1000)],
				[split(loan, 1000)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);

			const report = new ItemsReport([
				checkingToSavings,
				checkingToCreditCard,
				creditCardToChecking,
				creditCardToLoan,
			]);

			// Test expenses only (asset to liability transfers)
			const expensesResult = await reportsServiceComplex.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(expensesResult.value).toBe(-300); // Only checkingToCreditCard

			// Test incomes only (liability to asset transfers)
			const incomesResult = await reportsServiceComplex.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(incomesResult.value).toBe(200); // Only creditCardToChecking

			// Test all transactions
			const allResult = await reportsServiceComplex.getTotalPerMonth(
				report,
				"all"
			);
			expect(allResult.value).toBe(-100); // -300 + 200
		});

		it("should handle mixed recurring and one-time transfers", async () => {
			// Monthly recurring transfer from asset to liability (payment)
			const monthlyPayment = ScheduledItem.infinite(
				startDate,
				new ItemName("Monthly Credit Card Payment"),
				[split(assetAccount, 500)],
				[split(liabilityAccount, 500)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId,
				new ItemRecurrenceFrequency("1mo")
			);

			// One-time transfer from liability to asset (withdrawal)
			const oneTimeWithdrawal = ScheduledItem.oneTime(
				startDate,
				new ItemName("Credit Card Withdrawal"),
				[split(liabilityAccount, 1000)],
				[split(assetAccount, 1000)],
				ItemOperation.transfer(),
				categoryId,
				subCategoryId
			);

			const report = new ItemsReport([monthlyPayment, oneTimeWithdrawal]);

			// Test expenses only
			const expensesResult = await reportsService.getTotalPerMonth(
				report,
				"expenses"
			);
			expect(expensesResult.value).toBe(-500); // Only monthly payment

			// Test incomes only
			const incomesResult = await reportsService.getTotalPerMonth(
				report,
				"incomes"
			);
			expect(incomesResult.value).toBe(1000); // Only one-time withdrawal

			// Test all transactions
			const allResult = await reportsService.getTotalPerMonth(
				report,
				"all"
			);
			expect(allResult.value).toBe(500); // -500 + 1000
		});
	});
});
