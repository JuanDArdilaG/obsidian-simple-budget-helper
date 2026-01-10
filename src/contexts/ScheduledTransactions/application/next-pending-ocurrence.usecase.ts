import { NumberValueObject } from "@juandardilag/value-objects";
import { Nanoid, QueryUseCase } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import {
	IRecurrenceModificationsRepository,
	IScheduledTransactionsService,
	ItemRecurrenceInfo,
	RecurrenceModificationState,
} from "../domain";

export class NextPendingOccurrenceUseCase
	implements QueryUseCase<Nanoid, ItemRecurrenceInfo | null>
{
	readonly #logger = new Logger("NextPendingOccurrenceUseCase");

	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService,
		private readonly _recurrenceModificationsRepository: IRecurrenceModificationsRepository
	) {}

	async execute(
		scheduledTransactionID: Nanoid
	): Promise<ItemRecurrenceInfo | null> {
		this.#logger.debug(
			`Fetching next pending occurrence for scheduled transaction ID: ${scheduledTransactionID.value}`
		);

		const scheduledTransaction =
			await this._scheduledTransactionsService.getByID(
				scheduledTransactionID
			);

		this.#logger.debug(
			`Retrieved scheduled transaction: ${scheduledTransactionID.value}`
		);

		const modifications =
			await this._recurrenceModificationsRepository.findByScheduledItemId(
				scheduledTransactionID
			);

		this.#logger.debug(
			`Retrieved ${modifications.length} modifications for scheduled transaction ID: ${scheduledTransactionID.value}`
		);

		let info: ItemRecurrenceInfo | null = null;
		const maximumIterations = 10000; // Prevent infinite loops
		let i = 0;
		while (i < maximumIterations) {
			this.#logger.debug(
				`Checking occurrence index ${i} for scheduled transaction ID: ${scheduledTransactionID.value}`
			);
			const date =
				scheduledTransaction.recurrencePattern.getNthOccurrence(
					new NumberValueObject(i)
				);
			if (!date) {
				this.#logger.debug(
					`No further occurrences found in recurrence pattern for scheduled transaction ID: ${scheduledTransactionID.value}`
				);
				break;
			}
			const modification = modifications.find((mod) =>
				mod.originalDate.equalTo(date)
			);
			if (!modification) {
				info = ItemRecurrenceInfo.fromScheduledTransaction(
					scheduledTransaction,
					new NumberValueObject(i),
					date
				);
			} else {
				info = ItemRecurrenceInfo.fromModification(
					scheduledTransaction,
					modification
				);
			}
			if (info.state === RecurrenceModificationState.PENDING) {
				this.#logger.debug(
					`Found next pending occurrence at index ${i} for scheduled transaction ID: ${scheduledTransactionID.value}`
				);
				break;
			}
			info = null;
			i++;
		}

		return info;
	}
}
