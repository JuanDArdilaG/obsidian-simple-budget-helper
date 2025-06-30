import { NumberValueObject } from "@juandardilag/value-objects";
import { RecordFutureItemRecurrenceUseCase } from "contexts/Items/application/record-future-item-recurrence.usecase";
import { ItemID } from "contexts/Items/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("RecordFutureItemRecurrenceUseCase", () => {
	let useCase: RecordFutureItemRecurrenceUseCase;
	let itemsService: any;

	beforeEach(() => {
		itemsService = { recordFutureRecurrence: vi.fn() };
		useCase = new RecordFutureItemRecurrenceUseCase(itemsService);
	});

	it("should call itemsService.recordFutureRecurrence with correct parameters", async () => {
		const itemId = ItemID.generate();
		const n = new NumberValueObject(4);
		await useCase.execute({ id: itemId, n });
		expect(itemsService.recordFutureRecurrence).toHaveBeenCalledWith(
			itemId,
			n
		);
	});
});
