import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { CommandUseCase } from "contexts/Shared/domain/command-use-case.interface";
import { EntityNotFoundError } from "contexts/Shared/domain/errors/not-found.error";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ITransactionsService } from "contexts/Transactions/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionName } from "contexts/Transactions/domain/item-name.valueobject";
import { TransactionDate } from "contexts/Transactions/domain/transaction-date.valueobject";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { Nanoid } from "../../Shared/domain";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsService,
} from "../domain";

export type RecordScheduledTransactionUseCaseInput = {
	scheduledTransactionID: Nanoid;
	occurrenceIndex: NumberValueObject;
	date?: TransactionDate;
	fromSplits?: AccountSplit[];
	toSplits?: AccountSplit[];
};

export class RecordScheduledTransactionUseCase implements CommandUseCase<RecordScheduledTransactionUseCaseInput> {
	readonly #logger = new Logger("RecordOccurrenceV2UseCase");

	constructor(
		private readonly _transactionsService: ITransactionsService,
		private readonly _scheduledTransactionsService: IScheduledTransactionsService,
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService,
	) {}

	async execute({
		scheduledTransactionID,
		occurrenceIndex,
		date,
		fromSplits,
		toSplits,
	}: RecordScheduledTransactionUseCaseInput): Promise<void> {
		this.#logger.debug("Recording occurrence", {
			occurrenceIndex: occurrenceIndex.value,
			date: date?.value,
		});

		const scheduledTransaction =
			await this._scheduledTransactionsService.getByID(
				scheduledTransactionID,
			);
		if (!scheduledTransaction) {
			throw new EntityNotFoundError(
				"ScheduledTransaction",
				scheduledTransactionID,
			);
		}

		// Get the occurrence data (considering any existing modifications)
		const recurrenceInfo =
			await this._scheduledTransactionsService.getOccurrence(
				scheduledTransactionID,
				occurrenceIndex,
			);

		if (!recurrenceInfo) {
			throw new Error(
				`Invalid occurrence index: ${occurrenceIndex.value}`,
			);
		}

		// Determine effective transaction data
		const effectiveFromSplits = fromSplits ?? recurrenceInfo.originAccounts;
		const effectiveToSplits =
			toSplits ?? recurrenceInfo.destinationAccounts;
		const effectiveDate = date ?? recurrenceInfo.date;

		// Create transaction from the effective data
		const transaction = new Transaction(
			Nanoid.generate(),
			effectiveFromSplits,
			effectiveToSplits,
			new TransactionName(scheduledTransaction.name.value),
			scheduledTransaction.operation.type,
			scheduledTransaction.category.category,
			scheduledTransaction.category.subCategory,
			effectiveDate,
			DateValueObject.createNowDate(),
			recurrenceInfo.store,
		);

		this.#logger.debug("Created transaction", {
			transaction: transaction.toPrimitives(),
		});

		// Mark the occurrence as completed
		await this._recurrenceModificationsService.markOccurrenceAsCompleted(
			scheduledTransactionID,
			occurrenceIndex,
		);

		// Record the transaction
		await this._transactionsService.record(transaction);

		this.#logger.debug("Successfully recorded occurrence");
	}
}
