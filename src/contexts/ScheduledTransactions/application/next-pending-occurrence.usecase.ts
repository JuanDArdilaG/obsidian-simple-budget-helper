import { Nanoid, QueryUseCase } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import {
	IRecurrenceModificationsRepository,
	IScheduledTransactionsService,
	ItemRecurrenceInfo,
	RecurrenceState,
} from "../domain";

export class NextPendingOccurrenceUseCase implements QueryUseCase<
	Nanoid,
	ItemRecurrenceInfo | null
> {
	readonly #logger = new Logger("NextPendingOccurrenceUseCase");

	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService,
		private readonly _recurrenceModificationsRepository: IRecurrenceModificationsRepository,
	) {}

	async execute(
		scheduledTransactionID: Nanoid,
	): Promise<ItemRecurrenceInfo | null> {
		const scheduledTransaction =
			await this._scheduledTransactionsService.getByID(
				scheduledTransactionID.value,
			);

		const modifications =
			await this._recurrenceModificationsRepository.findByScheduledItemId(
				scheduledTransactionID,
			);

		let info: ItemRecurrenceInfo | null = null;
		const maximumIterations = 100; // Prevent infinite loops
		let i = 0;
		while (i < maximumIterations) {
			const date =
				scheduledTransaction.recurrencePattern.getNthOccurrence(i);
			if (!date) {
				this.#logger.debug(
					`No further occurrences found in recurrence pattern for scheduled transaction ID: ${scheduledTransactionID.value}`,
				);
				break;
			}
			const modification = modifications.find((mod) =>
				mod.originalDate.equalTo(date),
			);
			if (modification) {
				info = ItemRecurrenceInfo.fromModification(
					scheduledTransaction,
					modification,
				);
			} else {
				info = ItemRecurrenceInfo.fromScheduledTransaction(
					scheduledTransaction,
					i,
					date,
				);
			}
			if (info.state === RecurrenceState.PENDING) {
				break;
			}
			info = null;
			i++;
		}

		return info;
	}
}
