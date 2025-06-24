import {
	InvalidArgumentError,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ERecurrenceState, IItemsRepository } from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { CommandUseCase } from "../../Shared/domain/command-use-case.interface";
import { Logger } from "../../Shared/infrastructure/logger";
import { ITransactionsService } from "../domain";
import { PaymentSplit } from "../domain/payment-split.valueobject";
import { TransactionAmount } from "../domain/transaction-amount.valueobject";
import { TransactionDate } from "../domain/transaction-date.valueobject";
import { Transaction } from "../domain/transaction.entity";

export type RecordItemRecurrenceUseCaseInput = {
	itemID: ItemID;
	n: NumberValueObject;
	date?: TransactionDate;
	amount?: TransactionAmount;
	account?: AccountID;
	toAccount?: AccountID;
	permanentChanges?: boolean;
};

export class RecordItemRecurrenceUseCase
	implements CommandUseCase<RecordItemRecurrenceUseCaseInput>
{
	readonly #logger = new Logger("RecordItemRecurrenceUseCase");
	constructor(
		private readonly _transactionsService: ITransactionsService,
		private readonly _itemsRepository: IItemsRepository
	) {}

	async execute({
		itemID,
		n,
		date,
		amount,
		account,
		toAccount,
	}: RecordItemRecurrenceUseCaseInput): Promise<void> {
		this.#logger.debug("attributes", {
			itemID,
			date,
			amount,
			account,
			toAccount,
			n,
		});
		const item = await this._itemsRepository.findById(itemID);
		if (!item) throw new EntityNotFoundError("Item", itemID);
		if (!item?.recurrence)
			throw new InvalidArgumentError("Item has no recurrence", itemID);

		const transaction = Transaction.fromItem(
			item,
			date ?? TransactionDate.createNowDate()
		);

		this.#logger.debug("transaction from item", {
			transaction,
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

		item.recurrence.recurrences[n.value].updateState(
			ERecurrenceState.COMPLETED
		);

		this.#logger.debug("transaction after update", { transaction });

		await this._itemsRepository.persist(item);
		await this._transactionsService.record(transaction);
	}
}
