import { IItemsRepository, SimpleItem } from "contexts/SimpleItems/domain";
import { CommandUseCase } from "../../Shared/domain/command-use-case.interface";
import { Transaction, TransactionDate } from "contexts/Transactions/domain";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";

export type RecordSimpleItemUseCaseInput = {
	item: SimpleItem;
	date?: TransactionDate;
};

export class RecordSimpleItemUseCase
	implements CommandUseCase<RecordSimpleItemUseCaseInput>
{
	constructor(
		private _transactionsService: TransactionsService,
		private _itemsRepository: IItemsRepository
	) {}

	async execute({ item, date }: RecordSimpleItemUseCaseInput): Promise<void> {
		const transaction = Transaction.fromItem(
			item,
			date ?? TransactionDate.createNowDate()
		);

		if (!(await this._itemsRepository.exists(item.id)))
			await this._itemsRepository.persist(item);
		await this._transactionsService.record(transaction);
	}
}
