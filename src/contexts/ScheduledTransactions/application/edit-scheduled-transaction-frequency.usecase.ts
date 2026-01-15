import {
	CommandUseCase,
	EntityNotFoundError,
	Nanoid,
} from "../../Shared/domain";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsRepository,
	ItemRecurrenceFrequency,
} from "../domain";

export class EditScheduledTransactionFrequencyUseCase
	implements
		CommandUseCase<{ id: Nanoid; frequency: ItemRecurrenceFrequency }>
{
	constructor(
		private readonly _scheduledTransactionsRepository: IScheduledTransactionsRepository,
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService
	) {}

	async execute({
		id,
		frequency,
	}: {
		id: Nanoid;
		frequency: ItemRecurrenceFrequency;
	}): Promise<void> {
		const scheduledTransaction =
			await this._scheduledTransactionsRepository.findById(id);
		if (!scheduledTransaction) {
			throw new EntityNotFoundError("Scheduled transaction", id);
		}

		// Improvement opportunity: not clear but update the original date in modifications
		await this._recurrenceModificationsService.clearAllModifications(id);

		scheduledTransaction.recurrencePattern.updateFrequency(frequency);

		await this._scheduledTransactionsRepository.persist(
			scheduledTransaction
		);
	}
}
