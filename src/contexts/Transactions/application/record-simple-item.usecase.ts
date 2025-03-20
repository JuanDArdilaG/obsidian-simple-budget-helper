import { ItemID, IItemsRepository, Item } from "contexts/Items/domain";
import { CommandUseCase } from "../../Shared/domain/command-use-case.interface";
import {
	Transaction,
	ITransactionsRepository,
} from "contexts/Transactions/domain";

export type RecordSimpleItemUseCaseInput = Item;

export class RecordSimpleItemUseCase
	implements CommandUseCase<RecordSimpleItemUseCaseInput>
{
	constructor(
		private _transactionsRepository: ITransactionsRepository,
		private _itemsRepository: IItemsRepository
	) {}

	async execute(item: RecordSimpleItemUseCaseInput): Promise<void> {
		const transaction = Transaction.fromItem(item);

		await this._itemsRepository.persist(item);
		await this._transactionsRepository.persist(transaction);
	}
}
