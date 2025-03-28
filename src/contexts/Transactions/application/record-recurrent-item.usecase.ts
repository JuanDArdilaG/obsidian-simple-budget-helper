import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IItemsRepository } from "contexts/Items/domain/item-repository.interface";
import { Transaction } from "../domain/transaction.entity";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { TransactionDate } from "../domain/transaction-date.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { TransactionAmount } from "../domain/transaction-amount.valueobject";
import { CommandUseCase } from "../../Shared/domain/command-use-case.interface";
import { RecurrentItem } from "contexts/Items/domain/RecurrentItem/recurrent-item.entity";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";
import { RecurrentItemNextDate } from "contexts/Items/domain/RecurrentItem/recurrent-item-nextdate.valueobject";
import { Logger } from "../../Shared/infrastructure/logger";
import { TransactionsService } from "./transactions.service";

const logger = new Logger("RecordRecurrentItemUseCase");

export type RecordRecurrentItemUseCaseInput = {
	itemID: ItemID;
	date?: TransactionDate;
	amount?: TransactionAmount;
	account?: AccountID;
	permanentChanges?: boolean;
};

export class RecordRecurrentItemUseCase
	implements CommandUseCase<RecordRecurrentItemUseCaseInput>
{
	constructor(
		private _transactionsService: TransactionsService,
		private _itemsRepository: IItemsRepository
	) {}

	async execute({
		itemID,
		date,
		amount,
		account,
		permanentChanges,
	}: RecordRecurrentItemUseCaseInput): Promise<void> {
		const item = await this._itemsRepository.findById(itemID);
		if (!item) throw new EntityNotFoundError("Item", itemID.toString());
		if (!RecurrentItem.IsRecurrent(item))
			throw new InvalidArgumentError(
				"Item",
				ItemID.toString(),
				`item with id ${itemID} is not recurrent`
			);

		if (permanentChanges) {
			item.nextDate = new RecurrentItemNextDate(
				(date ?? item.nextDate).valueOf()
			);

			item.price = amount ?? item.price;
			item.account = account ?? item.account;
		}

		const prev = item.nextDate.copy();
		item.nextNextDate();

		logger.debug("calculating next date", {
			frequency: item.frequency,
			prev: prev,
			next: item.nextDate,
		});

		const transaction = Transaction.fromItem(
			item,
			date ?? TransactionDate.now()
		);

		await this._itemsRepository.persist(item);
		await this._transactionsService.record(transaction);
	}
}
