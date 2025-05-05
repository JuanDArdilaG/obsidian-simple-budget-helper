import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { Transaction } from "../domain/transaction.entity";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { TransactionDate } from "../domain/transaction-date.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { TransactionAmount } from "../domain/transaction-amount.valueobject";
import { CommandUseCase } from "../../Shared/domain/command-use-case.interface";
import { Logger } from "../../Shared/infrastructure/logger";
import { ITransactionsService } from "../domain";
import { IItemsRepository } from "contexts/Items/domain";

export type RecordItemUseCaseInput = {
	itemID: ItemID;
	date?: TransactionDate;
	amount?: TransactionAmount;
	account?: AccountID;
	toAccount?: AccountID;
	permanentChanges?: boolean;
};

export class RecordItemUseCase
	implements CommandUseCase<RecordItemUseCaseInput>
{
	readonly #logger = new Logger("RecordItemUseCase");
	constructor(
		private readonly _transactionsService: ITransactionsService,
		private readonly _itemsRepository: IItemsRepository
	) {}

	async execute({
		itemID,
		date,
		amount,
		account,
		toAccount,
	}: RecordItemUseCaseInput): Promise<void> {
		this.#logger.debug("attributes", {
			itemID,
			date,
			amount,
			account,
			toAccount,
		});
		const item = await this._itemsRepository.findById(itemID);
		if (!item) throw new EntityNotFoundError("Item", itemID);

		// if (item.recurrence) {
		// 	const prev = item.date.copy();
		// 	item.advanceDateToNextDate();

		// 	this.#logger.debug("calculating next date", {
		// 		frequency: item.recurrence.frequency,
		// 		prev: prev,
		// 		next: item.date,
		// 	});
		// }

		const transaction = Transaction.fromItem(
			item,
			date ?? TransactionDate.createNowDate()
		);

		this.#logger.debug("transaction from item", {
			transaction: transaction.toPrimitives(),
			item,
		});

		transaction.updateAmount(amount ?? item.price);
		transaction.updateAccount(account ?? item.account);
		transaction.updateToAccount(toAccount ?? item.toAccount);

		this.#logger.debug("transaction after update", { transaction });

		await this._itemsRepository.persist(item);
		await this._transactionsService.record(transaction);
	}
}
