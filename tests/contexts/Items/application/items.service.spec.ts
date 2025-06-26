import { DateValueObject } from "@juandardilag/value-objects";
import {
	Account,
	AccountID,
	AccountName,
	AccountType,
	IAccountsService,
} from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import { ItemsService } from "contexts/Items/application/items.service";
import {
	IScheduledItemsRepository,
	ItemID,
	ItemName,
	ItemRecurrenceFrequency,
	ScheduledItem,
} from "contexts/Items/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ItemsService", () => {
	let itemsService: ItemsService;
	let mockItemsRepository: IScheduledItemsRepository;
	let mockAccountsService: IAccountsService;

	beforeEach(() => {
		mockItemsRepository = {
			findById: vi.fn(),
			findAll: vi.fn(),
			findByCriteria: vi.fn(),
			persist: vi.fn(),
			deleteById: vi.fn(),
			exists: vi.fn(),
		} as unknown as IScheduledItemsRepository;

		mockAccountsService = {
			getByID: vi.fn(),
			create: vi.fn(),
			getAllNames: vi.fn(),
			adjustOnTransaction: vi.fn(),
			exists: vi.fn(),
			findById: vi.fn(),
			findAll: vi.fn(),
			findByCriteria: vi.fn(),
			persist: vi.fn(),
			deleteById: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
		} as unknown as IAccountsService;

		itemsService = new ItemsService(
			mockItemsRepository,
			mockAccountsService
		);
	});

	describe("getPricePerMonth", () => {
		it("should return correct price for income items", async () => {
			const itemID = ItemID.generate();
			const accountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(accountID, new TransactionAmount(100)),
			];
			const toSplits: PaymentSplit[] = [];

			const item = ScheduledItem.oneTime(
				DateValueObject.createNowDate(),
				new ItemName("Income Item"),
				fromSplits,
				toSplits,
				ItemOperation.income(accountID),
				CategoryID.generate(),
				SubCategoryID.generate()
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);

			const result = await itemsService.getPricePerMonth(itemID);

			expect(result.value).toBe(100);
		});

		it("should return correct price for expense items", async () => {
			const itemID = ItemID.generate();
			const accountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(accountID, new TransactionAmount(100)),
			];
			const toSplits: PaymentSplit[] = [];

			const item = ScheduledItem.oneTime(
				DateValueObject.createNowDate(),
				new ItemName("Expense Item"),
				fromSplits,
				toSplits,
				ItemOperation.expense(accountID),
				CategoryID.generate(),
				SubCategoryID.generate()
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);

			const result = await itemsService.getPricePerMonth(itemID);

			expect(result.value).toBe(-100);
		});

		it("should return correct price for asset to liability transfers", async () => {
			const itemID = ItemID.generate();
			const fromAccountID = AccountID.generate();
			const toAccountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(fromAccountID, new TransactionAmount(100)),
			];
			const toSplits = [
				new PaymentSplit(toAccountID, new TransactionAmount(100)),
			];

			const item = ScheduledItem.oneTime(
				DateValueObject.createNowDate(),
				new ItemName("Transfer Item"),
				fromSplits,
				toSplits,
				ItemOperation.transfer(fromAccountID, toAccountID),
				CategoryID.generate(),
				SubCategoryID.generate()
			);

			const fromAccount = Account.create(
				AccountType.asset(),
				new AccountName("Asset Account")
			);
			const toAccount = Account.create(
				AccountType.liability(),
				new AccountName("Liability Account")
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result = await itemsService.getPricePerMonth(itemID);

			expect(result.value).toBe(-100);
		});

		it("should return correct price for liability to asset transfers", async () => {
			const itemID = ItemID.generate();
			const fromAccountID = AccountID.generate();
			const toAccountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(fromAccountID, new TransactionAmount(100)),
			];
			const toSplits = [
				new PaymentSplit(toAccountID, new TransactionAmount(100)),
			];

			const item = ScheduledItem.oneTime(
				DateValueObject.createNowDate(),
				new ItemName("Transfer Item"),
				fromSplits,
				toSplits,
				ItemOperation.transfer(fromAccountID, toAccountID),
				CategoryID.generate(),
				SubCategoryID.generate()
			);

			const fromAccount = Account.create(
				AccountType.liability(),
				new AccountName("Liability Account")
			);
			const toAccount = Account.create(
				AccountType.asset(),
				new AccountName("Asset Account")
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result = await itemsService.getPricePerMonth(itemID);

			expect(result.value).toBe(100);
		});

		it("should return zero for asset to asset transfers", async () => {
			const itemID = ItemID.generate();
			const fromAccountID = AccountID.generate();
			const toAccountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(fromAccountID, new TransactionAmount(100)),
			];
			const toSplits = [
				new PaymentSplit(toAccountID, new TransactionAmount(100)),
			];

			const item = ScheduledItem.oneTime(
				DateValueObject.createNowDate(),
				new ItemName("Transfer Item"),
				fromSplits,
				toSplits,
				ItemOperation.transfer(fromAccountID, toAccountID),
				CategoryID.generate(),
				SubCategoryID.generate()
			);

			const fromAccount = Account.create(
				AccountType.asset(),
				new AccountName("Asset Account 1")
			);
			const toAccount = Account.create(
				AccountType.asset(),
				new AccountName("Asset Account 2")
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result = await itemsService.getPricePerMonth(itemID);

			expect(result.value).toBe(0);
		});

		it("should return zero for liability to liability transfers", async () => {
			const itemID = ItemID.generate();
			const fromAccountID = AccountID.generate();
			const toAccountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(fromAccountID, new TransactionAmount(100)),
			];
			const toSplits = [
				new PaymentSplit(toAccountID, new TransactionAmount(100)),
			];

			const item = ScheduledItem.oneTime(
				DateValueObject.createNowDate(),
				new ItemName("Transfer Item"),
				fromSplits,
				toSplits,
				ItemOperation.transfer(fromAccountID, toAccountID),
				CategoryID.generate(),
				SubCategoryID.generate()
			);

			const fromAccount = Account.create(
				AccountType.liability(),
				new AccountName("Liability Account 1")
			);
			const toAccount = Account.create(
				AccountType.liability(),
				new AccountName("Liability Account 2")
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);
			vi.mocked(mockAccountsService.getByID)
				.mockResolvedValueOnce(fromAccount)
				.mockResolvedValueOnce(toAccount);

			const result = await itemsService.getPricePerMonth(itemID);

			expect(result.value).toBe(0);
		});

		it("should calculate monthly price for recurring items", async () => {
			const itemID = ItemID.generate();
			const accountID = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(accountID, new TransactionAmount(100)),
			];
			const toSplits: PaymentSplit[] = [];

			const item = ScheduledItem.infinite(
				DateValueObject.createNowDate(),
				new ItemName("Recurring Income Item"),
				fromSplits,
				toSplits,
				ItemOperation.income(accountID),
				CategoryID.generate(),
				SubCategoryID.generate(),
				new ItemRecurrenceFrequency("1w")
			);

			vi.mocked(mockItemsRepository.findById).mockResolvedValue(item);

			const result = await itemsService.getPricePerMonth(itemID);

			// 1 week frequency means 4.35 times per month (30.4167 days / 7 days)
			expect(result.value).toBeCloseTo(435, 0);
		});
	});
});
