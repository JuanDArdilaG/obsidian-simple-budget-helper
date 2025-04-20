import { describe, expect, it } from "vitest";
import { TransactionsServiceMock } from "../domain/transactions-service.mock";
import { buildTestItems } from "../../Items/domain/buildTestItems";
import { TransactionDate } from "contexts/Transactions/domain";
import { RecordItemUseCase } from "contexts/Transactions/application/record-item.usecase";
import { ItemsRepositoryMock } from "../../Items/domain/items-repository.mock";

describe("execute", () => {
	it("should record transfer item (1 recurrence) without modifications", async () => {
		const items = buildTestItems(1);
		const transactionsService = new TransactionsServiceMock([]);
		const itemsRepository = new ItemsRepositoryMock(items);
		const useCase = new RecordItemUseCase(
			transactionsService,
			itemsRepository
		);
		const item = items[0];

		await useCase.execute({
			itemID: item.id,
			date: TransactionDate.createNowDate(),
		});

		expect(itemsRepository.items[0]).toBe(item);
		expect(transactionsService.transactions[0].amount.value).toEqual(100);
	});
});
