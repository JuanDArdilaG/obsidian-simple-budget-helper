import { Nanoid, QueryUseCase } from "../../Shared/domain";
import { Logger } from "../../Shared/infrastructure/logger";
import { IScheduledTransactionsService, ItemRecurrenceInfo } from "../domain";

export class NextPendingOccurrenceUseCase
	implements QueryUseCase<Nanoid, ItemRecurrenceInfo | null>
{
	readonly #logger = new Logger("NextPendingOccurrenceUseCase");

	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService
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

		const nextOccurrence =
			await this._scheduledTransactionsService.getOccurrence(
				scheduledTransactionID,
				scheduledTransaction.nextOccurrenceIndex
			);

		if (!nextOccurrence) {
			this.#logger.debug(
				`No next occurrence found for scheduled transaction ID: ${scheduledTransactionID.value}`
			);
		}

		return nextOccurrence;
	}
}
