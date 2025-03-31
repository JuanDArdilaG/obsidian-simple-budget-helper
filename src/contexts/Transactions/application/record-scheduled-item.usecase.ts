import { ItemID } from "contexts/SimpleItems/domain/item-id.valueobject";
import { IItemsRepository } from "contexts/SimpleItems/domain/item-repository.interface";
import { Transaction } from "../domain/transaction.entity";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { TransactionDate } from "../domain/transaction-date.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { TransactionAmount } from "../domain/transaction-amount.valueobject";
import { CommandUseCase } from "../../Shared/domain/command-use-case.interface";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";
import { Logger } from "../../Shared/infrastructure/logger";
import { ITransactionsService } from "../domain";
import { IScheduledItemsRepository } from "contexts/ScheduledItems/domain/scheduled-item-repository.interface";

export type RecordScheduledItemUseCaseInput = {
	itemID: ItemID;
	date?: TransactionDate;
	amount?: TransactionAmount;
	account?: AccountID;
	toAccount?: AccountID;
	permanentChanges?: boolean;
};

export class RecordScheduledItemUseCase
	implements CommandUseCase<RecordScheduledItemUseCaseInput>
{
	#logger = new Logger("RecordScheduledItemUseCase");
	constructor(
		private _transactionsService: ITransactionsService,
		private _scheduledItemsRepository: IScheduledItemsRepository
	) {}

	async execute({
		itemID,
		date,
		amount,
		account,
		toAccount,
	}: RecordScheduledItemUseCaseInput): Promise<void> {
		this.#logger
			.debugB("attributes", {
				itemID,
				date,
				amount,
				account,
				toAccount,
			})
			.log();
		const item = await this._scheduledItemsRepository.findById(itemID);
		if (!item) throw new EntityNotFoundError("Item", itemID);

		if (item.recurrence) {
			const prev = item.date.copy();
			item.updateDateToNextDate();

			this.#logger.debug("calculating next date", {
				frequency: item.recurrence.frequency,
				prev: prev,
				next: item.date,
			});
		}

		const transaction = Transaction.fromItem(
			item,
			date ?? TransactionDate.createNowDate()
		);

		this.#logger
			.debugB("transaction from item", {
				transaction: transaction.toPrimitives(),
				item,
			})
			.log();

		transaction.updateAmount(amount ?? item.price);
		transaction.updateAccount(account ?? item.account);
		transaction.updateToAccount(toAccount ?? item.toAccount);

		this.#logger.debugB("transaction after update", { transaction }).log();

		await this._scheduledItemsRepository.persist(item);
		await this._transactionsService.record(transaction);
	}
}
