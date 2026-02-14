import { CommandUseCase, Nanoid } from "contexts/Shared/domain";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsService,
} from "../domain";

export class DeleteScheduledTransactionUseCase implements CommandUseCase<Nanoid> {
	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService,
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService,
	) {}

	async execute(id: Nanoid): Promise<void> {
		await this._recurrenceModificationsService.clearAllModifications(id);
		await this._scheduledTransactionsService.delete(id.value);
	}
}
