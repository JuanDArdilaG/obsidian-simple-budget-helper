import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { IScheduledItemsRepository } from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { CommandUseCase } from "../../Shared/domain/command-use-case.interface";
import { Logger } from "../../Shared/infrastructure/logger";
import { ITransactionsService } from "../domain";
import { PaymentSplit } from "../domain/payment-split.valueobject";
import { TransactionAmount } from "../domain/transaction-amount.valueobject";
import { TransactionDate } from "../domain/transaction-date.valueobject";
import { Transaction } from "../domain/transaction.entity";

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
		private readonly _scheduledItemsRepository: IScheduledItemsRepository
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
		const item = await this._scheduledItemsRepository.findById(itemID);
		if (!item) throw new EntityNotFoundError("ScheduledItem", itemID);

		// if (item.recurrence) {
		// 	const prev = item.date.copy();
		// 	item.advanceDateToNextDate();

		// 	this.#logger.debug("calculating next date", {
		// 		frequency: item.recurrence.frequency,
		// 		prev: prev,
		// 		next: item.date,
		// 	});
		// }

		const transaction = Transaction.fromScheduledItem(
			item,
			date ?? TransactionDate.createNowDate()
		);

		this.#logger.debug("transaction from item", {
			transaction: transaction.toPrimitives(),
			item,
		});

		// Update splits if amount/account/toAccount are provided
		if (amount || account || toAccount) {
			let fromSplits = transaction.fromSplits;
			let toSplits = transaction.toSplits;
			if (account && amount) {
				fromSplits = [new PaymentSplit(account, amount)];
			}
			if (toAccount && amount) {
				toSplits = [new PaymentSplit(toAccount, amount)];
			}
			transaction.setFromSplits(fromSplits);
			transaction.setToSplits(toSplits);
		}

		this.#logger.debug("transaction after update", { transaction });

		await this._scheduledItemsRepository.persist(item);
		await this._transactionsService.record(transaction);
	}
}
