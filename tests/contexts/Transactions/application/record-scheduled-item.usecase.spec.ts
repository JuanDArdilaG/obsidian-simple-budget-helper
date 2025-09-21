import { RecordItemUseCase } from "contexts/Transactions/application/record-item.usecase";
import { TransactionDate } from "contexts/Transactions/domain";
import { describe, expect, it } from "vitest";
import { AccountID } from "../../../../src/contexts/Accounts/domain";
import { ItemPrice } from "../../../../src/contexts/Items/domain";
import { ItemOperation } from "../../../../src/contexts/Shared/domain";
import { buildTestItems } from "../../Items/domain/buildTestItems";
import { ItemsRepositoryMock } from "../../Items/domain/items-repository.mock";
import { TransactionsServiceMock } from "../domain/transactions-service.mock";

describe("execute", () => {
	it("should record transfer item (1 recurrence) without modifications", async () => {
		const items = buildTestItems([
			{
				price: new ItemPrice(100),
				operation: ItemOperation.transfer(),
				account: AccountID.generate(),
				toAccount: AccountID.generate(),
			},
		]);
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
		const tx = transactionsService.transactions[0];
		expect(tx.fromAmount.value).toEqual(100);
		expect(tx.toAmount.value).toEqual(100);
	});
});
