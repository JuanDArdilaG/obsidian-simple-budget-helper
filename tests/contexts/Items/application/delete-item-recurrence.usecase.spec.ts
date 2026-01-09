import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemID } from "contexts/Items/domain";
import { DeleteItemRecurrenceUseCase } from "contexts/ScheduledTransactions/application/delete-scheduled-transaction-recurrence.usecase";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("DeleteItemRecurrenceUseCase", () => {
	let useCase: DeleteItemRecurrenceUseCase;
	let itemsService: any;

	beforeEach(() => {
		itemsService = { deleteRecurrence: vi.fn() };
		useCase = new DeleteItemRecurrenceUseCase(itemsService);
	});

	it("should call itemsService.deleteRecurrence with correct parameters", async () => {
		const itemId = ItemID.generate();
		const n = new NumberValueObject(2);
		await useCase.execute({ id: itemId, n });
		expect(itemsService.deleteRecurrence).toHaveBeenCalledWith(itemId, n);
	});
});
