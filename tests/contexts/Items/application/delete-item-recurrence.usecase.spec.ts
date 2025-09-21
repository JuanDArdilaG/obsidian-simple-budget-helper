import { NumberValueObject } from "@juandardilag/value-objects";
import { DeleteItemRecurrenceUseCase } from "contexts/Items/application/delete-item-recurrence.usecase";
import { ItemID } from "contexts/Items/domain";
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
