import { StringValueObject } from "@juandardilag/value-objects";
import {
	Account,
	AccountAssetSubtype,
	AccountLiabilitySubtype,
	AccountName,
	IAccountsService,
} from "contexts/Accounts/domain";
import { Category } from "contexts/Categories/domain";
import { ItemOperation, Nanoid } from "contexts/Shared/domain";
import { Subcategory } from "contexts/Subcategories/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Currency } from "../../../../src/contexts/Currencies/domain/currency.vo";
import { ScheduledTransactionsService } from "../../../../src/contexts/ScheduledTransactions/application/scheduled-transactions.service";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsRepository,
	ItemRecurrenceFrequency,
	RecurrencePattern,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

const category = Category.create(new StringValueObject("Salary"));
const subCategory = Subcategory.create(
	new Nanoid(category.id),
	new StringValueObject("Monthly Salary"),
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
					Account.createAsset(
						AccountAssetSubtype.CASH,
						new AccountName("Test Account"),
						new Currency("USD"),
					),
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
			mockAccountsService,
		);
	});

	describe("getMonthlyPriceEstimate", () => {
		it("should return correct price for income items", async () => {
			const itemID = Nanoid.generate();
			const account = buildTestAccounts(1)[0];
			const fromSplits = [
				new AccountSplit(account.nanoid, new TransactionAmount(100)),
			];
			const toSplits: AccountSplit[] = [];

			const item = ScheduledTransaction.create(
				new StringValueObject("Income Item"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.income(),
				new Nanoid(category.id),
				new Nanoid(subCategory.id),
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID,
				);

			expect(result.value).toBe(100);
		});

		it("should return correct price for expense items", async () => {
			const itemID = Nanoid.generate();
			const account = buildTestAccounts(1)[0];
			const fromSplits = [
				new AccountSplit(account.nanoid, new TransactionAmount(100)),
			];
			const toSplits: AccountSplit[] = [];

			const item = ScheduledTransaction.create(
				new StringValueObject("Expense Item"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.expense(),
				new Nanoid(category.id),
				new Nanoid(subCategory.id),
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID,
				);

			expect(result.value).toBe(-100);
		});

		it("should return correct price for asset to liability transfers", async () => {
			const itemID = Nanoid.generate();

			const fromAccount = Account.createAsset(
				AccountAssetSubtype.CASH,
				new AccountName("Asset Account"),
				new Currency("USD"),
			);
			const toAccount = Account.createLiability(
				AccountLiabilitySubtype.CREDIT_CARD,
				new AccountName("Liability Account"),
				new Currency("USD"),
			);

			const fromSplits = [
				new AccountSplit(
					fromAccount.nanoid,
					new TransactionAmount(100),
				),
			];
			const toSplits = [
				new AccountSplit(toAccount.nanoid, new TransactionAmount(100)),
			];

			const item = ScheduledTransaction.create(
				new StringValueObject("Transfer Item"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new Nanoid(category.id),
				new Nanoid(subCategory.id),
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID,
				);

			expect(result.value).toBe(-100);
		});

		it("should return correct price for liability to asset transfers", async () => {
			const itemID = Nanoid.generate();
			const fromAccount = Account.createLiability(
				AccountLiabilitySubtype.CREDIT_CARD,
				new AccountName("Liability Account"),
				new Currency("USD"),
			);
			const toAccount = Account.createAsset(
				AccountAssetSubtype.CASH,
				new AccountName("Asset Account"),
				new Currency("USD"),
			);
			const fromSplits = [
				new AccountSplit(
					fromAccount.nanoid,
					new TransactionAmount(100),
				),
			];
			const toSplits = [
				new AccountSplit(toAccount.nanoid, new TransactionAmount(100)),
			];

			const item = ScheduledTransaction.create(
				new StringValueObject("Transfer Item"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new Nanoid(category.id),
				new Nanoid(subCategory.id),
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID,
				);

			expect(result.value).toBe(100);
		});

		it("should return zero for asset to asset transfers", async () => {
			const itemID = Nanoid.generate();

			const fromAccount = Account.createAsset(
				AccountAssetSubtype.CASH,
				new AccountName("Asset Account 1"),
				new Currency("USD"),
			);
			const toAccount = Account.createAsset(
				AccountAssetSubtype.CASH,
				new AccountName("Asset Account 2"),
				new Currency("USD"),
			);

			const fromSplits = [
				new AccountSplit(
					fromAccount.nanoid,
					new TransactionAmount(100),
				),
			];
			const toSplits = [
				new AccountSplit(toAccount.nanoid, new TransactionAmount(100)),
			];

			const item = ScheduledTransaction.create(
				new StringValueObject("Transfer Item"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new Nanoid(category.id),
				new Nanoid(subCategory.id),
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID,
				);

			expect(result.value).toBe(0);
		});

		it("should return zero for liability to liability transfers", async () => {
			const scheduledTransactionId = Nanoid.generate();
			const fromAccount = Account.createLiability(
				AccountLiabilitySubtype.CREDIT_CARD,
				new AccountName("Liability Account 1"),
				new Currency("USD"),
			);
			const toAccount = Account.createLiability(
				AccountLiabilitySubtype.CREDIT_CARD,
				new AccountName("Liability Account 2"),
				new Currency("USD"),
			);
			const fromSplits = [
				new AccountSplit(
					fromAccount.nanoid,
					new TransactionAmount(100),
				),
			];
			const toSplits = [
				new AccountSplit(toAccount.nanoid, new TransactionAmount(100)),
			];

			const scheduledTransaction = ScheduledTransaction.create(
				new StringValueObject("Transfer Item"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.transfer(),
				new Nanoid(category.id),
				new Nanoid(subCategory.id),
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(
				scheduledTransaction,
			);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					scheduledTransactionId,
				);

			expect(result.value).toBe(0);
		});

		it("should calculate monthly price for recurring items", async () => {
			const itemID = Nanoid.generate();
			const account = buildTestAccounts(1)[0];
			const fromSplits = [
				new AccountSplit(account.nanoid, new TransactionAmount(100)),
			];
			const toSplits: AccountSplit[] = [];

			const item = ScheduledTransaction.create(
				new StringValueObject("Recurring Income Item"),
				RecurrencePattern.infinite(
					ScheduledTransactionDate.createNowDate(),
					new ItemRecurrenceFrequency("1w"),
				),
				fromSplits,
				toSplits,
				ItemOperation.income(),
				new Nanoid(category.id),
				new Nanoid(subCategory.id),
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);

			const result =
				await scheduledTransactionsService.getMonthlyPriceEstimate(
					itemID,
				);

			// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
			expect(result.value).toBeCloseTo(435, 0);
		});
	});
});
