import { describe, expect, it } from "vitest";
import { TransactionsServiceMock } from "../domain/transactions-service.mock";
import { buildTestItems } from "../../Items/domain/buildTestItems";
import { TransactionDate } from "contexts/Transactions/domain";
import { RecordScheduledItemUseCase } from "contexts/Transactions/application/record-scheduled-item.usecase";
import { ScheduledItemsRepositoryMock } from "../../ScheduledItems/infrastructure/scheduled-items-repository.mock";

describe("execute", () => {
	it("should record transfer scheduled item (1 recurrence) without modifications", async () => {
		const items = buildTestItems({ scheduled: 1 });
		const transactionsService = new TransactionsServiceMock([]);
		const itemsRepository = new ScheduledItemsRepositoryMock(
			items.scheduled
		);
		const useCase = new RecordScheduledItemUseCase(
			transactionsService,
			itemsRepository
		);
		const item = items.scheduled[0];

		await useCase.execute({
			itemID: item.id,
			date: TransactionDate.createNowDate(),
		});

		expect(itemsRepository.items[0]).toBe(item);
		expect(transactionsService.transactions[0].amount.valueOf()).toEqual(
			100
		);
	});
});
