import {
	DateValueObject,
	InvalidArgumentError,
	NumberValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { CategoryID } from "contexts/Categories/domain";
import {
	ItemID,
	ItemName,
	ItemRecurrenceFrequency,
} from "contexts/Items/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { RecordItemRecurrenceUseCase } from "contexts/Transactions/application/record-item-recurrence.usecase";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionDate } from "contexts/Transactions/domain/transaction-date.valueobject";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScheduledItemV2 } from "../../../../src/contexts/Items/domain/v2/scheduled-item-v2.entity";
import { IScheduledItemsV2Service } from "../../../../src/contexts/Items/domain/v2/services.interface";
import { TransactionsServiceMock } from "../domain/transactions-service.mock";

describe("RecordItemRecurrenceUseCase", () => {
	let useCase: RecordItemRecurrenceUseCase;
	let mockTransactionsService: TransactionsServiceMock;
	let mockScheduledItemsV2Service: IScheduledItemsV2Service;
	let testItemsV2: ScheduledItemV2[];

	beforeEach(() => {
		mockTransactionsService = new TransactionsServiceMock([]);
		const account1 = AccountID.generate();

		// Create test items using ScheduledItemV2
		const fromSplits = [
			new PaymentSplit(account1, new TransactionAmount(100)),
		];
		const toSplits: PaymentSplit[] = [];

		const testItem = ScheduledItemV2.createInfinite(
			new ItemName("Test Item"),
			DateValueObject.createNowDate(),
			new ItemRecurrenceFrequency("monthly"),
			fromSplits,
			toSplits,
			ItemOperation.expense(),
			CategoryID.generate(),
			SubCategoryID.generate()
		);

		testItemsV2 = [testItem];

		// Create mock for IScheduledItemsV2Service
		mockScheduledItemsV2Service = {
			exists: vi.fn(),
			create: vi.fn(),
			getByID: vi.fn().mockImplementation(async (id: ItemID) => {
				const found = testItemsV2.find(
					(item) => item.id.value === id.value
				);
				if (!found) {
					throw new EntityNotFoundError(
						"ScheduledItemV2",
						new StringValueObject(id.value)
					);
				}
				return found;
			}),
			getByCriteria: vi.fn(),
			getAll: vi.fn().mockResolvedValue(testItemsV2),
			update: vi.fn().mockResolvedValue(undefined),
			delete: vi.fn(),
			getByCategory: vi.fn(),
			getBySubCategory: vi.fn(),
			hasItemsByCategory: vi.fn(),
			hasItemsBySubCategory: vi.fn(),
			reassignItemsCategory: vi.fn(),
			reassignItemsSubCategory: vi.fn(),
			reassignItemsCategoryAndSubcategory: vi.fn(),
			updateRecurrencePattern: vi.fn(),
			getOccurrence: vi.fn(),
			getMonthlyPriceEstimate: vi.fn(),
		} as IScheduledItemsV2Service;

		useCase = new RecordItemRecurrenceUseCase(
			mockTransactionsService,
			mockScheduledItemsV2Service
		);
	});

	describe("basic recording functionality", () => {
		it("should record a transaction for a scheduled item", async () => {
			// Arrange
			const item = testItemsV2[0];
			const n = new NumberValueObject(0);

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
			});

			// Assert
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.fromAmount.value).toBe(100);
			expect(mockScheduledItemsV2Service.update).toHaveBeenCalledWith(
				item
			);
		});

		it("should throw EntityNotFoundError for non-existent item", async () => {
			// Arrange
			const n = new NumberValueObject(0);

			// Act & Assert
			await expect(
				useCase.execute({
					itemID: ItemID.generate(),
					n,
				})
			).rejects.toThrow(EntityNotFoundError);
		});

		it("should throw InvalidArgumentError for item without recurrence", async () => {
			// Arrange
			// Create a new item without recurrence
			const itemWithoutRecurrence = ScheduledItemV2.createOneTime(
				new ItemName("Test Item"),
				DateValueObject.createNowDate(),
				[
					new PaymentSplit(
						AccountID.generate(),
						new TransactionAmount(100)
					),
				],
				[],
				ItemOperation.expense(),
				CategoryID.generate(),
				SubCategoryID.generate()
			);

			// Mock the service to return an item without recurrence pattern
			const mockServiceWithoutRecurrence: IScheduledItemsV2Service = {
				...mockScheduledItemsV2Service,
				getByID: vi.fn().mockResolvedValue({
					...itemWithoutRecurrence,
					recurrence: undefined,
				}),
			};

			const useCaseWithoutRecurrence = new RecordItemRecurrenceUseCase(
				mockTransactionsService,
				mockServiceWithoutRecurrence
			);

			const n = new NumberValueObject(0);

			// Act & Assert
			await expect(
				useCaseWithoutRecurrence.execute({
					itemID: itemWithoutRecurrence.id,
					n,
				})
			).rejects.toThrow(InvalidArgumentError);
		});
	});

	describe("single split modifications", () => {
		it("should update transaction with new account and amount", async () => {
			// Arrange
			const item = testItemsV2[0];
			const n = new NumberValueObject(0);
			const newAccount = AccountID.generate();
			const newAmount = new TransactionAmount(150);

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				fromSplits: [new PaymentSplit(newAccount, newAmount)],
			});

			// Assert
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.fromSplits[0].accountId.value).toBe(
				newAccount.value
			);
			expect(recordedTransaction.fromSplits[0].amount.value).toBe(150);
		});

		it("should update transaction with new toAccount for transfers", async () => {
			// Arrange
			const account1 = AccountID.generate();
			const account2 = AccountID.generate();
			const transferItem = ScheduledItemV2.createInfinite(
				new ItemName("Transfer Item"),
				DateValueObject.createNowDate(),
				new ItemRecurrenceFrequency("monthly"),
				[new PaymentSplit(account1, new TransactionAmount(100))],
				[new PaymentSplit(account2, new TransactionAmount(100))],
				ItemOperation.transfer(),
				CategoryID.generate(),
				SubCategoryID.generate()
			);

			// Update test items and mock
			const transferItems = [transferItem];
			const mockServiceForTransfer: IScheduledItemsV2Service = {
				...mockScheduledItemsV2Service,
				getByID: vi.fn().mockImplementation(async (id: ItemID) => {
					const found = transferItems.find(
						(item) => item.id.value === id.value
					);
					if (!found) {
						throw new EntityNotFoundError(
							"ScheduledItemV2",
							new StringValueObject(id.value)
						);
					}
					return found;
				}),
			};

			const useCaseForTransfer = new RecordItemRecurrenceUseCase(
				mockTransactionsService,
				mockServiceForTransfer
			);

			const item = transferItem;
			const n = new NumberValueObject(0);
			const newToAccount = AccountID.generate();

			// Act
			await useCaseForTransfer.execute({
				itemID: item.id,
				n,
				toSplits: [
					new PaymentSplit(newToAccount, new TransactionAmount(100)),
				],
			});

			// Assert
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.toSplits[0].accountId.value).toBe(
				newToAccount.value
			);
			expect(recordedTransaction.toSplits[0].amount.value).toBe(100);
		});
	});

	describe("multiple splits support", () => {
		it("should handle multiple fromSplits", async () => {
			// Arrange
			const item = testItemsV2[0];
			const n = new NumberValueObject(0);
			const account1 = AccountID.generate();
			const account2 = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(account1, new TransactionAmount(60)),
				new PaymentSplit(account2, new TransactionAmount(40)),
			];

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				fromSplits,
			});

			// Assert
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.fromSplits).toHaveLength(2);
			expect(recordedTransaction.fromSplits[0].accountId.value).toBe(
				account1.value
			);
			expect(recordedTransaction.fromSplits[0].amount.value).toBe(60);
			expect(recordedTransaction.fromSplits[1].accountId.value).toBe(
				account2.value
			);
			expect(recordedTransaction.fromSplits[1].amount.value).toBe(40);
		});

		it("should handle multiple toSplits for transfers", async () => {
			// Arrange
			const account1 = AccountID.generate();
			const account2 = AccountID.generate();
			const transferItem = ScheduledItemV2.createInfinite(
				new ItemName("Transfer Item"),
				DateValueObject.createNowDate(),
				new ItemRecurrenceFrequency("monthly"),
				[new PaymentSplit(account1, new TransactionAmount(100))],
				[new PaymentSplit(account2, new TransactionAmount(100))],
				ItemOperation.transfer(),
				CategoryID.generate(),
				SubCategoryID.generate()
			);

			const transferItems = [transferItem];
			const mockServiceForTransfer: IScheduledItemsV2Service = {
				...mockScheduledItemsV2Service,
				getByID: vi.fn().mockImplementation(async (id: ItemID) => {
					const found = transferItems.find(
						(item) => item.id.value === id.value
					);
					if (!found) {
						throw new EntityNotFoundError(
							"ScheduledItemV2",
							new StringValueObject(id.value)
						);
					}
					return found;
				}),
			};

			const useCaseForTransfer = new RecordItemRecurrenceUseCase(
				mockTransactionsService,
				mockServiceForTransfer
			);

			const item = transferItem;
			const n = new NumberValueObject(0);
			const toAccount1 = AccountID.generate();
			const toAccount2 = AccountID.generate();
			const toSplits = [
				new PaymentSplit(toAccount1, new TransactionAmount(70)),
				new PaymentSplit(toAccount2, new TransactionAmount(30)),
			];

			// Act
			await useCaseForTransfer.execute({
				itemID: item.id,
				n,
				toSplits,
			});

			// Assert
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.toSplits).toHaveLength(2);
			expect(recordedTransaction.toSplits[0].accountId.value).toBe(
				toAccount1.value
			);
			expect(recordedTransaction.toSplits[0].amount.value).toBe(70);
			expect(recordedTransaction.toSplits[1].accountId.value).toBe(
				toAccount2.value
			);
			expect(recordedTransaction.toSplits[1].amount.value).toBe(30);
		});
	});

	describe("date handling", () => {
		it("should use provided date for transaction", async () => {
			// Arrange
			const item = testItemsV2[0];
			const n = new NumberValueObject(0);
			const customDate = new TransactionDate(new Date("2023-01-15"));

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				date: customDate,
			});

			// Assert
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(
				recordedTransaction.date.value.toISOString().split("T")[0]
			).toBe("2023-01-15");
		});

		it("should use current date when no date is provided", async () => {
			// Arrange
			const item = testItemsV2[0];
			const n = new NumberValueObject(0);
			const beforeExecution = new Date();

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
			});

			// Assert
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			const afterExecution = new Date();
			expect(
				recordedTransaction.date.value.getTime()
			).toBeGreaterThanOrEqual(beforeExecution.getTime());
			expect(
				recordedTransaction.date.value.getTime()
			).toBeLessThanOrEqual(afterExecution.getTime());
		});
	});
});
