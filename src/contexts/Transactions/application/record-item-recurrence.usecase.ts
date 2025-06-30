import {
	DateValueObject,
	InvalidArgumentError,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import {
	ERecurrenceState,
	IScheduledItemsRepository,
} from "contexts/Items/domain";
import { ItemDate } from "contexts/Items/domain/item-date.valueobject";
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
	fromSplits?: PaymentSplit[];
	toSplits?: PaymentSplit[];
};

export class RecordItemRecurrenceUseCase
	implements CommandUseCase<RecordItemRecurrenceUseCaseInput>
{
	readonly #logger = new Logger("RecordItemRecurrenceUseCase");
	constructor(
		private readonly _transactionsService: ITransactionsService,
		private readonly _scheduledItemsRepository: IScheduledItemsRepository
	) {}

	async execute({
		itemID,
		n,
		date,
		amount,
		account,
		toAccount,
		permanentChanges,
		fromSplits,
		toSplits,
	}: RecordItemRecurrenceUseCaseInput): Promise<void> {
		this.#logger.debug("attributes", {
			itemID,
			date,
			amount,
			account,
			toAccount,
			n,
			permanentChanges,
			fromSplits,
			toSplits,
		});
		const item = await this._scheduledItemsRepository.findById(itemID);
		if (!item) throw new EntityNotFoundError("ScheduledItem", itemID);
		if (!item?.recurrence)
			throw new InvalidArgumentError(
				"ScheduledItem has no recurrence",
				itemID
			);

		const transaction = Transaction.fromScheduledItem(
			item,
			date ?? TransactionDate.createNowDate()
		);

		this.#logger.debug("transaction from item", {
			transaction,
			item,
		});

		// Update splits if provided
		let shouldUpdateSplits = false;
		let newFromSplits = transaction.fromSplits;
		let newToSplits = transaction.toSplits;

		// Handle multiple splits if provided
		if (fromSplits && fromSplits.length > 0) {
			newFromSplits = fromSplits;
			shouldUpdateSplits = true;
		} else if (amount || account) {
			// Fallback to single split logic for backward compatibility
			if (account && amount) {
				newFromSplits = [new PaymentSplit(account, amount)];
				shouldUpdateSplits = true;
			}
		}

		if (toSplits && toSplits.length > 0) {
			newToSplits = toSplits;
			shouldUpdateSplits = true;
		} else if (amount || toAccount) {
			// Fallback to single split logic for backward compatibility
			if (toAccount && amount) {
				newToSplits = [new PaymentSplit(toAccount, amount)];
				shouldUpdateSplits = true;
			}
		}

		if (shouldUpdateSplits) {
			transaction.setFromSplits(newFromSplits);
			transaction.setToSplits(newToSplits);

			// If permanent changes are requested, update the scheduled item as well
			if (permanentChanges) {
				this.#logger.debug(
					"Applying permanent changes to scheduled item",
					{
						fromSplits: newFromSplits,
						toSplits: newToSplits,
						date,
					}
				);

				// Update the scheduled item's splits
				item.setFromSplits(newFromSplits);
				item.setToSplits(newToSplits);
			}
		}

		// If permanent changes are requested, update the recurrence start date if a new date is provided
		if (permanentChanges && date) {
			this.#logger.debug("Updating recurrence start date", {
				oldStartDate: item.recurrence.startDate,
				newStartDate: date.value,
			});
			// Advance to the next occurrence after the recorded date
			const freq = item.recurrence.frequency;
			if (freq) {
				const recordedDate = new ItemDate(date.value);
				const nextDate = recordedDate.next(freq);
				item.recurrence.updateStartDate(nextDate);
			} else {
				item.recurrence.updateStartDate(
					new DateValueObject(date.value)
				);
			}
		}

		// Mark the current recurrence as completed
		item.recurrence.recurrences[n.value].updateState(
			ERecurrenceState.COMPLETED
		);

		this.#logger.debug("transaction after update", { transaction });

		await this._scheduledItemsRepository.persist(item);
		await this._transactionsService.record(transaction);
	}
}
