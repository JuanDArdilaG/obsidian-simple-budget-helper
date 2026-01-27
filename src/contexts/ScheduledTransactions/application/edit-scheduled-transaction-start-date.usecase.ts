import { DateValueObject } from "@juandardilag/value-objects";
import {
	CommandUseCase,
	EntityNotFoundError,
	Nanoid,
} from "../../Shared/domain";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsRepository,
	ScheduledTransactionDate,
} from "../domain";

export class EditScheduledTransactionStartDateUseCase implements CommandUseCase<{
	id: Nanoid;
	startDate: DateValueObject;
}> {
	constructor(
		private readonly _scheduledTransactionsRepository: IScheduledTransactionsRepository,
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService,
	) {}

	async execute({
		id,
		startDate,
	}: {
		id: Nanoid;
		startDate: DateValueObject;
	}): Promise<void> {
		const scheduledTransaction =
			await this._scheduledTransactionsRepository.findById(id.value);
		if (!scheduledTransaction) {
			throw new EntityNotFoundError("Scheduled transaction", id);
		}

		// Improvement opportunity: not clear but update the original date in modifications
		await this._recurrenceModificationsService.clearAllModifications(id);

		scheduledTransaction.recurrencePattern.updateStartDate(
			new ScheduledTransactionDate(startDate),
		);

		await this._scheduledTransactionsRepository.persist(
			scheduledTransaction,
		);
	}
}
