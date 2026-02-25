import {
	CommandUseCase,
	EntityNotFoundError,
	Nanoid,
} from "../../Shared/domain";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsRepository,
	RecurrencePattern,
} from "../domain";

export class EditScheduledTransactionRecurrencePatternUseCase implements CommandUseCase<{
	id: Nanoid;
	recurrencePattern: RecurrencePattern;
}> {
	constructor(
		private readonly _scheduledTransactionsRepository: IScheduledTransactionsRepository,
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService,
	) {}

	async execute({
		id,
		recurrencePattern,
	}: {
		id: Nanoid;
		recurrencePattern: RecurrencePattern;
	}): Promise<void> {
		const scheduledTransaction =
			await this._scheduledTransactionsRepository.findById(id.value);
		if (!scheduledTransaction) {
			throw new EntityNotFoundError("Scheduled transaction", id);
		}

		// Improvement opportunity: not clear but update the original date in modifications
		await this._recurrenceModificationsService.clearAllModifications(id);

		scheduledTransaction.recurrencePattern = recurrencePattern;

		await this._scheduledTransactionsRepository.persist(
			scheduledTransaction,
		);
	}
}
