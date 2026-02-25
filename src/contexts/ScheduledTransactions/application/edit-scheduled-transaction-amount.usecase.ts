import { CommandUseCase } from "../../Shared/domain";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsService,
	ScheduledTransaction,
} from "../domain";

export class EditScheduledTransactionUseCase implements CommandUseCase<{
	scheduledTransaction: ScheduledTransaction;
}> {
	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService,
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService,
	) {}

	async execute({
		scheduledTransaction,
	}: {
		scheduledTransaction: ScheduledTransaction;
	}): Promise<void> {
		await this._recurrenceModificationsService.clearAllModifications(
			scheduledTransaction.nanoid,
		);
		await this._scheduledTransactionsService.update(scheduledTransaction);
	}
}
