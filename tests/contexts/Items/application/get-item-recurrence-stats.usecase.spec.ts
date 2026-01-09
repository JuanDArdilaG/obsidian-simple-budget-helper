import { ItemID } from "contexts/Items/domain";
import { GetItemRecurrenceStatsUseCase } from "contexts/ScheduledTransactions/application/get-item-recurrence-stats.usecase";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("GetItemRecurrenceStatsUseCase", () => {
	let useCase: GetItemRecurrenceStatsUseCase;
	let itemsService: any;

	beforeEach(() => {
		itemsService = { getRecurrenceStats: vi.fn() };
		useCase = new GetItemRecurrenceStatsUseCase(itemsService);
	});

	it("should call itemsService.getRecurrenceStats and return its result", async () => {
		const itemId = ItemID.generate();
		const stats = {
			active: 1,
			completed: 2,
			pending: 3,
			deleted: 4,
			total: 10,
		};
		itemsService.getRecurrenceStats.mockResolvedValue(stats);
		const result = await useCase.execute({ id: itemId });
		expect(itemsService.getRecurrenceStats).toHaveBeenCalledWith(itemId);
		expect(result).toEqual(stats);
	});
});
