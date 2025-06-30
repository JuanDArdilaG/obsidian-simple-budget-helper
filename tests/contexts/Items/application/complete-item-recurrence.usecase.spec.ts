import { NumberValueObject } from "@juandardilag/value-objects";
import { CompleteItemRecurrenceUseCase } from "contexts/Items/application/complete-item-recurrence.usecase";
import { ItemID } from "contexts/Items/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("CompleteItemRecurrenceUseCase", () => {
	let useCase: CompleteItemRecurrenceUseCase;
	let itemsService: any;

	beforeEach(() => {
		itemsService = { completeRecurrence: vi.fn() };
		useCase = new CompleteItemRecurrenceUseCase(itemsService);
	});

	it("should call itemsService.completeRecurrence with correct parameters", async () => {
		const itemId = ItemID.generate();
		const n = new NumberValueObject(3);
		await useCase.execute({ id: itemId, n });
		expect(itemsService.completeRecurrence).toHaveBeenCalledWith(itemId, n);
	});
});
