import { StringValueObject } from "@juandardilag/value-objects";
import {
	Account,
	AccountID,
	AccountName,
	AccountType,
	IAccountsService,
} from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import { ItemOperation, Nanoid } from "contexts/Shared/domain";
import { SubCategory } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Currency } from "../../../../src/contexts/Currencies/domain/currency.vo";
import { ScheduledTransactionsService } from "../../../../src/contexts/ScheduledTransactions/application/scheduled-transactions.service";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsRepository,
	ItemRecurrenceFrequency,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { TransactionCategory } from "../../../../src/contexts/Transactions/domain";

const category = Category.create(new StringValueObject("Salary"));
const subCategory = SubCategory.create(
	category.id,
	new StringValueObject("Monthly Salary")
);

describe("ScheduledTransactionsService", () => {
	let scheduledTransactionsService: ScheduledTransactionsService;
	let mockItemsRepository: IScheduledTransactionsRepository;
	let mockAccountsService: IAccountsService;

	beforeEach(() => {
		mockItemsRepository = {
			findById: vi.fn(),
			findAll: vi.fn(),
			findByCriteria: vi.fn(),
			persist: vi.fn(),
			deleteById: vi.fn(),
			exists: vi.fn(),
		} as unknown as IScheduledTransactionsRepository;

		mockAccountsService = {
			getByID: vi
				.fn()
				.mockResolvedValue(
					Account.create(
						AccountType.asset(),
						new AccountName("Test Account"),
						new Currency("USD")
					)
				),
			create: vi.fn(),
			getAllNames: vi.fn(),
			adjustOnTransaction: vi.fn(),
			exists: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			getByCriteria: vi.fn(),
			getAll: vi.fn(),
		};

		// Mock the recurrence modifications service using Jest
		const recurrenceModificationsService: IRecurrenceModificationsService =
			{
				countModificationsByScheduledItem: vi.fn().mockResolvedValue(0),
				deleteModificationsByScheduledItem: vi.fn(),
				create: vi.fn(),
				delete: vi.fn(),
				exists: vi.fn().mockResolvedValue(false),
				getAll: vi.fn().mockResolvedValue([]),
				getByCriteria: vi.fn().mockResolvedValue([]),
				getByID: vi.fn().mockResolvedValue(null),
				getByScheduledItemId: vi.fn().mockResolvedValue([]),
				getByScheduledItemIdAndOccurrenceIndex: vi
					.fn()
					.mockResolvedValue(null),
				clearAllModifications: vi.fn(),
				getStatsByScheduledItem: vi.fn(),
				markOccurrenceAsCompleted: vi.fn(),
				markOccurrenceAsDeleted: vi.fn(),
				modifyOccurrence: vi.fn(),
				resetOccurrenceToPending: vi.fn(),
				update: vi.fn(),
			};

		scheduledTransactionsService = new ScheduledTransactionsService(
			mockItemsRepository,
			recurrenceModificationsService,
			mockAccountsService
		);
	});

	describe("getMonthlyPriceEstimate", () => {
		it("should return correct price for income items", async () => {
			const itemID = Nanoid.generate();
			const accountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(accountID, new TransactionAmount(100)),
			];
			const toSplits: PaymentSplit[] = [];

			const item = ScheduledTransaction.createOneTime(
				new StringValueObject("Income Item"),
				ScheduledTransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				ItemOperation.income(),
				new TransactionCategory(category, subCategory)
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID
				);

			expect(result.value).toBe(100);
		});

		it("should return correct price for expense items", async () => {
			const itemID = Nanoid.generate();
			const accountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(accountID, new TransactionAmount(100)),
			];
			const toSplits: PaymentSplit[] = [];

			const item = ScheduledTransaction.createOneTime(
				new StringValueObject("Expense Item"),
				ScheduledTransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				ItemOperation.expense(),
				new TransactionCategory(category, subCategory)
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID
				);

			expect(result.value).toBe(-100);
		});

		it("should return correct price for asset to liability transfers", async () => {
			const itemID = Nanoid.generate();
			const fromAccountID = AccountID.generate();
			const toAccountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(fromAccountID, new TransactionAmount(100)),
			];
			const toSplits = [
				new PaymentSplit(toAccountID, new TransactionAmount(100)),
			];

			const item = ScheduledTransaction.createOneTime(
				new StringValueObject("Transfer Item"),
				ScheduledTransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new TransactionCategory(category, subCategory)
			);

			const fromAccount = Account.create(
				AccountType.asset(),
				new AccountName("Asset Account"),
				new Currency("USD")
			);
			const toAccount = Account.create(
				AccountType.liability(),
				new AccountName("Liability Account"),
				new Currency("USD")
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID
				);

			expect(result.value).toBe(-100);
		});

		it("should return correct price for liability to asset transfers", async () => {
			const itemID = Nanoid.generate();
			const fromAccountID = AccountID.generate();
			const toAccountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(fromAccountID, new TransactionAmount(100)),
			];
			const toSplits = [
				new PaymentSplit(toAccountID, new TransactionAmount(100)),
			];

			const item = ScheduledTransaction.createOneTime(
				new StringValueObject("Transfer Item"),
				ScheduledTransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new TransactionCategory(category, subCategory)
			);

			const fromAccount = Account.create(
				AccountType.liability(),
				new AccountName("Liability Account"),
				new Currency("USD")
			);
			const toAccount = Account.create(
				AccountType.asset(),
				new AccountName("Asset Account"),
				new Currency("USD")
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID
				);

			expect(result.value).toBe(100);
		});

		it("should return zero for asset to asset transfers", async () => {
			const itemID = Nanoid.generate();
			const fromAccountID = AccountID.generate();
			const toAccountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(fromAccountID, new TransactionAmount(100)),
			];
			const toSplits = [
				new PaymentSplit(toAccountID, new TransactionAmount(100)),
			];

			const item = ScheduledTransaction.createOneTime(
				new StringValueObject("Transfer Item"),
				ScheduledTransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new TransactionCategory(category, subCategory)
			);

			const fromAccount = Account.create(
				AccountType.asset(),
				new AccountName("Asset Account 1"),
				new Currency("USD")
			);
			const toAccount = Account.create(
				AccountType.asset(),
				new AccountName("Asset Account 2"),
				new Currency("USD")
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID
				);

			expect(result.value).toBe(0);
		});

		it("should return zero for liability to liability transfers", async () => {
			const scheduledTransactionId = Nanoid.generate();
			const fromAccountID = AccountID.generate();
			const toAccountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(fromAccountID, new TransactionAmount(100)),
			];
			const toSplits = [
				new PaymentSplit(toAccountID, new TransactionAmount(100)),
			];

			const scheduledTransaction = ScheduledTransaction.createOneTime(
				new StringValueObject("Transfer Item"),
				ScheduledTransactionDate.createNowDate(),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new TransactionCategory(category, subCategory)
			);

			const fromAccount = Account.create(
				AccountType.liability(),
				new AccountName("Liability Account 1"),
				new Currency("USD")
			);
			const toAccount = Account.create(
				AccountType.liability(),
				new AccountName("Liability Account 2"),
				new Currency("USD")
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(
				scheduledTransaction
			);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					scheduledTransactionId
				);

			expect(result.value).toBe(0);
		});

		it("should calculate monthly price for recurring items", async () => {
			const itemID = Nanoid.generate();
			const accountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(accountID, new TransactionAmount(100)),
			];
			const toSplits: PaymentSplit[] = [];

			const item = ScheduledTransaction.create(
				new StringValueObject("Recurring Income Item"),
				ScheduledTransactionDate.createNowDate(),
				new ItemRecurrenceFrequency("1w"),
				fromSplits,
				toSplits,
				ItemOperation.income(),
				new TransactionCategory(category, subCategory)
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID
				);

			// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
			expect(result.value).toBeCloseTo(435, 0);
		});
	});
});
