import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { IItemsRepository } from "contexts/Items/domain/item-repository.interface";
import { ITransactionsRepository } from "../domain/transactions-repository.interface";
import { Transaction } from "../domain/transaction.entity";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { TransactionDate } from "../domain/transaction-date.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { TransactionAmount } from "../domain/transaction-amount.valueobject";
import { CommandUseCase } from "../../Shared/domain/command-use-case.interface";
import { BooleanValueObject } from "@juandardilag/value-objects/BooleanValueObject";
import { RecurrentItem } from "contexts/Items/domain/RecurrentItem/recurrent-item.entity";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";
import { RecurrentItemNextDate } from "contexts/Items/domain/RecurrentItem/recurrent-item-nextdate.valueobject";
import { Logger } from "../../Shared/infrastructure/logger";

const logger = new Logger("RecordRecurrentItemUseCase");

export type RecordRecurrentItemUseCaseInput = {
	itemID: ItemID;
	date?: TransactionDate;
	amount?: TransactionAmount;
	account?: AccountID;
	permanentChanges?: BooleanValueObject;
};

export class RecordRecurrentItemUseCase
	implements CommandUseCase<RecordRecurrentItemUseCaseInput>
{
	constructor(
		private _transactionsRepository: ITransactionsRepository,
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
		if (!item) throw new EntityNotFoundError("Item", itemID);
		if (!RecurrentItem.IsRecurrent(item))
			throw new InvalidArgumentError(
				"Item",
				ItemID.toString(),
				`item with id ${itemID} is not recurrent`
			);

		if (permanentChanges?.eval()) {
			item.nextDate = new RecurrentItemNextDate(
				(date ?? item.nextDate).valueOf()
			);

			item.amount = amount ?? item.amount;
			item.account = account ?? item.account;
		}

		const nextDate = item.nextDate.next(item.frequency);

		logger.debug("calculating next date", {
			frequency: item.frequency,
			prev: item.nextDate,
			next: nextDate,
		});

		const transaction = Transaction.fromItem(
			item,
			date ?? TransactionDate.now()
		);

		await this._transactionsRepository.persist(transaction);
	}
}
