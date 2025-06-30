import {
	InvalidArgumentError,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import {
	IScheduledItemsRepository,
	ItemPrice,
	ScheduledItem,
} from "contexts/Items/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { RecordItemRecurrenceUseCase } from "contexts/Transactions/application/record-item-recurrence.usecase";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionDate } from "contexts/Transactions/domain/transaction-date.valueobject";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildTestItems } from "../../Items/domain/buildTestItems";
import { ItemsRepositoryMock } from "../../Items/domain/items-repository.mock";
import { TransactionsServiceMock } from "../domain/transactions-service.mock";

describe("RecordItemRecurrenceUseCase", () => {
	let useCase: RecordItemRecurrenceUseCase;
	let mockTransactionsService: TransactionsServiceMock;
	let mockScheduledItemsRepository: IScheduledItemsRepository;
	let testItems: ScheduledItem[];

	beforeEach(() => {
		mockTransactionsService = new TransactionsServiceMock([]);
		const account1 = AccountID.generate();
		testItems = buildTestItems([
			{
				price: new ItemPrice(100),
				operation: ItemOperation.expense(),
				account: account1,
			},
		]);
		mockScheduledItemsRepository = new ItemsRepositoryMock(testItems);
		useCase = new RecordItemRecurrenceUseCase(
			mockTransactionsService,
			mockScheduledItemsRepository
		);
	});

	describe("basic recording functionality", () => {
		it("should record a transaction for a scheduled item", async () => {
			// Arrange
			const item = testItems[0];
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
			expect(item.recurrence.recurrences[0].state.toString()).toBe(
				"completed"
			);
		});

		it("should throw EntityNotFoundError for non-existent item", async () => {
			// Arrange
			const nonExistentItemID = "non-existent-id";
			const n = new NumberValueObject(0);

			// Act & Assert
			await expect(
				useCase.execute({
					itemID: { value: nonExistentItemID } as any,
					n,
				})
			).rejects.toThrow(EntityNotFoundError);
		});

		it("should throw InvalidArgumentError for item without recurrence", async () => {
			// Arrange
			// Create a new item without recurrence by mocking the repository to return an item without recurrence
			const itemWithoutRecurrence = buildTestItems([
				{
					price: new ItemPrice(100),
					operation: ItemOperation.expense(),
				},
			])[0];

			// Mock the repository to return an item without recurrence
			const mockRepositoryWithoutRecurrence = {
				...mockScheduledItemsRepository,
				findById: vi.fn().mockResolvedValue({
					...itemWithoutRecurrence,
					recurrence: undefined,
				}),
			};

			const useCaseWithoutRecurrence = new RecordItemRecurrenceUseCase(
				mockTransactionsService,
				mockRepositoryWithoutRecurrence
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
			const item = testItems[0];
			const n = new NumberValueObject(0);
			const newAccount = AccountID.generate();
			const newAmount = new TransactionAmount(150);

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				account: newAccount,
				amount: newAmount,
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
			const transferItems = buildTestItems([
				{
					price: new ItemPrice(100),
					operation: ItemOperation.transfer(),
					account: account1,
					toAccount: account2,
				},
			]);
			mockScheduledItemsRepository = new ItemsRepositoryMock(
				transferItems
			);
			useCase = new RecordItemRecurrenceUseCase(
				mockTransactionsService,
				mockScheduledItemsRepository
			);

			const item = transferItems[0];
			const n = new NumberValueObject(0);
			const newToAccount = AccountID.generate();
			const newAmount = new TransactionAmount(200);

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				toAccount: newToAccount,
				amount: newAmount,
			});

			// Assert
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.toSplits[0].accountId.value).toBe(
				newToAccount.value
			);
			expect(recordedTransaction.toSplits[0].amount.value).toBe(200);
		});
	});

	describe("multiple splits support", () => {
		it("should handle multiple fromSplits", async () => {
			// Arrange
			const item = testItems[0];
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
			const transferItems = buildTestItems([
				{
					price: new ItemPrice(100),
					operation: ItemOperation.transfer(),
					account: account1,
					toAccount: account2,
				},
			]);
			mockScheduledItemsRepository = new ItemsRepositoryMock(
				transferItems
			);
			useCase = new RecordItemRecurrenceUseCase(
				mockTransactionsService,
				mockScheduledItemsRepository
			);

			const item = transferItems[0];
			const n = new NumberValueObject(0);
			const toAccount1 = AccountID.generate();
			const toAccount2 = AccountID.generate();
			const toSplits = [
				new PaymentSplit(toAccount1, new TransactionAmount(70)),
				new PaymentSplit(toAccount2, new TransactionAmount(30)),
			];

			// Act
			await useCase.execute({
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

	describe("permanent changes functionality", () => {
		it("should update scheduled item splits when permanentChanges is true", async () => {
			// Arrange
			const item = testItems[0];
			const n = new NumberValueObject(0);
			const newAccount = AccountID.generate();
			const newAmount = new TransactionAmount(150);
			const originalFromSplits = [...item.fromSplits];

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				account: newAccount,
				amount: newAmount,
				permanentChanges: true,
			});

			// Assert
			// Check that the scheduled item was updated
			expect(item.fromSplits).toHaveLength(1);
			expect(item.fromSplits[0].accountId.value).toBe(newAccount.value);
			expect(item.fromSplits[0].amount.value).toBe(150);
			expect(item.fromSplits).not.toEqual(originalFromSplits);

			// Check that the transaction was recorded with new values
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.fromSplits[0].accountId.value).toBe(
				newAccount.value
			);
			expect(recordedTransaction.fromSplits[0].amount.value).toBe(150);
		});

		it("should NOT update scheduled item when permanentChanges is false", async () => {
			// Arrange
			const item = testItems[0];
			const n = new NumberValueObject(0);
			const newAccount = AccountID.generate();
			const newAmount = new TransactionAmount(150);
			const originalFromSplits = [...item.fromSplits];

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				account: newAccount,
				amount: newAmount,
				permanentChanges: false,
			});

			// Assert
			// Check that the scheduled item was NOT updated
			expect(item.fromSplits).toEqual(originalFromSplits);

			// Check that the transaction was recorded with new values
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.fromSplits[0].accountId.value).toBe(
				newAccount.value
			);
			expect(recordedTransaction.fromSplits[0].amount.value).toBe(150);
		});

		it("should update scheduled item with multiple splits when permanentChanges is true", async () => {
			// Arrange
			const item = testItems[0];
			const n = new NumberValueObject(0);
			const account1 = AccountID.generate();
			const account2 = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(account1, new TransactionAmount(60)),
				new PaymentSplit(account2, new TransactionAmount(40)),
			];
			const originalFromSplits = [...item.fromSplits];

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				fromSplits,
				permanentChanges: true,
			});

			// Assert
			// Check that the scheduled item was updated with multiple splits
			expect(item.fromSplits).toHaveLength(2);
			expect(item.fromSplits[0].accountId.value).toBe(account1.value);
			expect(item.fromSplits[0].amount.value).toBe(60);
			expect(item.fromSplits[1].accountId.value).toBe(account2.value);
			expect(item.fromSplits[1].amount.value).toBe(40);
			expect(item.fromSplits).not.toEqual(originalFromSplits);

			// Check that the transaction was recorded with new values
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.fromSplits).toHaveLength(2);
		});

		it("should update scheduled item operation accounts when permanentChanges is true", async () => {
			// Arrange
			const item = testItems[0];
			const n = new NumberValueObject(0);
			const newAccount = AccountID.generate();
			const newToAccount = AccountID.generate();
			const originalAccount = item.fromSplits[0]?.accountId;

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				account: newAccount,
				toAccount: newToAccount,
				fromSplits: [
					new PaymentSplit(newAccount, new TransactionAmount(100)),
				],
				toSplits: [
					new PaymentSplit(newToAccount, new TransactionAmount(100)),
				],
				permanentChanges: true,
			});

			// Assert
			// Check that the scheduled item operation was updated
			expect(item.fromSplits[0]?.accountId.value).toBe(newAccount.value);
			expect(item.toSplits[0]?.accountId?.value).toBe(newToAccount.value);
			expect(item.fromSplits[0]?.accountId.value).not.toBe(
				originalAccount.value
			);
		});

		it("should update scheduled item with multiple toSplits for transfers when permanentChanges is true", async () => {
			// Arrange
			const account1 = AccountID.generate();
			const account2 = AccountID.generate();
			const transferItems = buildTestItems([
				{
					price: new ItemPrice(100),
					operation: ItemOperation.transfer(),
					account: account1,
					toAccount: account2,
				},
			]);
			mockScheduledItemsRepository = new ItemsRepositoryMock(
				transferItems
			);
			useCase = new RecordItemRecurrenceUseCase(
				mockTransactionsService,
				mockScheduledItemsRepository
			);

			const item = transferItems[0];
			const n = new NumberValueObject(0);
			const toAccount1 = AccountID.generate();
			const toAccount2 = AccountID.generate();
			const toSplits = [
				new PaymentSplit(toAccount1, new TransactionAmount(70)),
				new PaymentSplit(toAccount2, new TransactionAmount(30)),
			];
			const originalToSplits = [...item.toSplits];

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				toSplits,
				permanentChanges: true,
			});

			// Assert
			// Check that the scheduled item was updated with multiple toSplits
			expect(item.toSplits).toHaveLength(2);
			expect(item.toSplits[0].accountId.value).toBe(toAccount1.value);
			expect(item.toSplits[0].amount.value).toBe(70);
			expect(item.toSplits[1].accountId.value).toBe(toAccount2.value);
			expect(item.toSplits[1].amount.value).toBe(30);
			expect(item.toSplits).not.toEqual(originalToSplits);

			// Check that the transaction was recorded with new values
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.toSplits).toHaveLength(2);
		});

		it("should update scheduled item recurrence start date when permanentChanges is true and new date is provided", async () => {
			// Arrange
			const item = testItems[0];
			const n = new NumberValueObject(0);
			const newDate = new TransactionDate(new Date("2024-01-15"));
			const originalStartDate = item.recurrence.startDate;

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				date: newDate,
				permanentChanges: true,
			});

			// Assert
			// Check that the recurrence start date was updated
			expect(
				item.recurrence.startDate.value.toISOString().split("T")[0]
			).toBe("2024-01-15");
			expect(item.recurrence.startDate.value).not.toEqual(
				originalStartDate.value
			);

			// Check that the transaction was recorded with the new date
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(
				recordedTransaction.date.value.toISOString().split("T")[0]
			).toBe("2024-01-15");
		});

		it("should NOT update scheduled item recurrence start date when permanentChanges is false", async () => {
			// Arrange
			const item = testItems[0];
			const n = new NumberValueObject(0);
			const newDate = new TransactionDate(new Date("2024-01-15"));
			const originalStartDate = item.recurrence.startDate;

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				date: newDate,
				permanentChanges: false,
			});

			// Assert
			// Check that the recurrence start date was NOT updated
			expect(item.recurrence.startDate.value).toEqual(
				originalStartDate.value
			);

			// Check that the transaction was recorded with the new date
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(
				recordedTransaction.date.value.toISOString().split("T")[0]
			).toBe("2024-01-15");
		});
	});

	describe("backward compatibility", () => {
		it("should work with single split parameters (backward compatibility)", async () => {
			// Arrange
			const item = testItems[0];
			const n = new NumberValueObject(0);
			const newAccount = AccountID.generate();
			const newAmount = new TransactionAmount(150);

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				account: newAccount,
				amount: newAmount,
				permanentChanges: true,
			});

			// Assert
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.fromSplits).toHaveLength(1);
			expect(recordedTransaction.fromSplits[0].accountId.value).toBe(
				newAccount.value
			);
			expect(recordedTransaction.fromSplits[0].amount.value).toBe(150);

			// Check that the scheduled item was updated
			expect(item.fromSplits).toHaveLength(1);
			expect(item.fromSplits[0].accountId.value).toBe(newAccount.value);
			expect(item.fromSplits[0].amount.value).toBe(150);
		});

		it("should prioritize multiple splits over single split parameters", async () => {
			// Arrange
			const item = testItems[0];
			const n = new NumberValueObject(0);
			const singleAccount = AccountID.generate();
			const singleAmount = new TransactionAmount(200);
			const multipleAccount1 = AccountID.generate();
			const multipleAccount2 = AccountID.generate();
			const fromSplits = [
				new PaymentSplit(multipleAccount1, new TransactionAmount(60)),
				new PaymentSplit(multipleAccount2, new TransactionAmount(40)),
			];

			// Act
			await useCase.execute({
				itemID: item.id,
				n,
				account: singleAccount,
				amount: singleAmount,
				fromSplits,
				permanentChanges: true,
			});

			// Assert
			// Should use multiple splits, not single parameters
			expect(mockTransactionsService.transactions).toHaveLength(1);
			const recordedTransaction = mockTransactionsService.transactions[0];
			expect(recordedTransaction.fromSplits).toHaveLength(2);
			expect(recordedTransaction.fromSplits[0].accountId.value).toBe(
				multipleAccount1.value
			);
			expect(recordedTransaction.fromSplits[0].amount.value).toBe(60);
			expect(recordedTransaction.fromSplits[1].accountId.value).toBe(
				multipleAccount2.value
			);
			expect(recordedTransaction.fromSplits[1].amount.value).toBe(40);

			// Check that the scheduled item was updated with multiple splits
			expect(item.fromSplits).toHaveLength(2);
			expect(item.fromSplits[0].accountId.value).toBe(
				multipleAccount1.value
			);
			expect(item.fromSplits[0].amount.value).toBe(60);
		});
	});

	describe("date handling", () => {
		it("should use provided date for transaction", async () => {
			// Arrange
			const item = testItems[0];
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
			const item = testItems[0];
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
