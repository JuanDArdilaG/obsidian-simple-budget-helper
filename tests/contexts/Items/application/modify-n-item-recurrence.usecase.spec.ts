import { NumberValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain";
import { ItemsService } from "contexts/Items/application/items.service";
import { ItemID, ItemRecurrenceInfo } from "contexts/Items/domain";
import { ERecurrenceState } from "contexts/Items/domain/item-recurrence-modification.valueobject";
import { ModifyNItemRecurrenceUseCase } from "contexts/ScheduledTransactions/application/modify-n-item-recurrence.usecase";
import { ItemDate } from "contexts/ScheduledTransactions/domain/scheduled-transaction-date.vo";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ModifyNItemRecurrenceUseCase", () => {
	let useCase: ModifyNItemRecurrenceUseCase;
	let itemsService: ItemsService;

	beforeEach(() => {
		itemsService = {
			modifyRecurrence: vi.fn(),
		} as unknown as ItemsService;

		useCase = new ModifyNItemRecurrenceUseCase(itemsService);
	});

	describe("execute", () => {
		it("should call itemsService.modifyRecurrence with correct parameters including splits", async () => {
			// Arrange
			const itemId = ItemID.generate();
			const n = new NumberValueObject(0);
			const newRecurrence = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-02-01")),
				ERecurrenceState.PENDING
			);
			const fromSplits = [
				new PaymentSplit(
					AccountID.generate(),
					new TransactionAmount(100)
				),
			];
			const toSplits = [
				new PaymentSplit(
					AccountID.generate(),
					new TransactionAmount(100)
				),
			];

			// Act
			await useCase.execute({
				id: itemId,
				n,
				newRecurrence,
				fromSplits,
				toSplits,
			});

			// Assert
			expect(itemsService.modifyRecurrence).toHaveBeenCalledWith(
				itemId,
				n,
				newRecurrence,
				fromSplits,
				toSplits
			);
		});

		it("should call itemsService.modifyRecurrence without splits when not provided", async () => {
			// Arrange
			const itemId = ItemID.generate();
			const n = new NumberValueObject(0);
			const newRecurrence = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-02-01")),
				ERecurrenceState.PENDING
			);

			// Act
			await useCase.execute({
				id: itemId,
				n,
				newRecurrence,
			});

			// Assert
			expect(itemsService.modifyRecurrence).toHaveBeenCalledWith(
				itemId,
				n,
				newRecurrence,
				undefined,
				undefined
			);
		});

		it("should handle partial splits (only fromSplits)", async () => {
			// Arrange
			const itemId = ItemID.generate();
			const n = new NumberValueObject(0);
			const newRecurrence = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-02-01")),
				ERecurrenceState.PENDING
			);
			const fromSplits = [
				new PaymentSplit(
					AccountID.generate(),
					new TransactionAmount(100)
				),
			];

			// Act
			await useCase.execute({
				id: itemId,
				n,
				newRecurrence,
				fromSplits,
			});

			// Assert
			expect(itemsService.modifyRecurrence).toHaveBeenCalledWith(
				itemId,
				n,
				newRecurrence,
				fromSplits,
				undefined
			);
		});

		it("should handle partial splits (only toSplits)", async () => {
			// Arrange
			const itemId = ItemID.generate();
			const n = new NumberValueObject(0);
			const newRecurrence = new ItemRecurrenceInfo(
				new ItemDate(new Date("2024-02-01")),
				ERecurrenceState.PENDING
			);
			const toSplits = [
				new PaymentSplit(
					AccountID.generate(),
					new TransactionAmount(100)
				),
			];

			// Act
			await useCase.execute({
				id: itemId,
				n,
				newRecurrence,
				toSplits,
			});

			// Assert
			expect(itemsService.modifyRecurrence).toHaveBeenCalledWith(
				itemId,
				n,
				newRecurrence,
				undefined,
				toSplits
			);
		});
	});
});
