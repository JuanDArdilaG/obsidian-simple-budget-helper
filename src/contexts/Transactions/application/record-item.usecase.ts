import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IItemsRepository } from "contexts/Items/domain/item-repository.interface";
import { ITransactionsRepository } from "../domain/transactions-repository.interface";
import { Transaction } from "../domain/transaction.entity";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";

export class RecordItemUseCase {
	constructor(
		private _transactionsRepository: ITransactionsRepository,
		private _itemsRepository: IItemsRepository
	) {}

	async execute(itemID: ItemID): Promise<void> {
		const item = await this._itemsRepository.findById(itemID);
		if (!item) throw new EntityNotFoundError("Item", itemID);
		const transaction = Transaction.fromItem(item);

		await this._transactionsRepository.persist(transaction);
	}
}
