import { DeleteItemRecurrenceUseCase } from "contexts/ScheduledTransactions/application/delete-scheduled-transaction-recurrence.usecase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Nanoid } from "../../../../src/contexts/Shared/domain";

describe("DeleteItemRecurrenceUseCase", () => {
	let useCase: DeleteItemRecurrenceUseCase;
	let itemsService: any;

	beforeEach(() => {
		itemsService = {
			deleteRecurrence: vi.fn(),
			markOccurrenceAsDeleted: vi.fn(),
		};
		useCase = new DeleteItemRecurrenceUseCase(itemsService);
	});

	it("should call itemsService.deleteRecurrence with correct parameters", async () => {
		const itemId = Nanoid.generate();
		const n = 2;

		await useCase.execute({ id: itemId, n });

		expect(itemsService.markOccurrenceAsDeleted).toHaveBeenCalled();
	});
});
