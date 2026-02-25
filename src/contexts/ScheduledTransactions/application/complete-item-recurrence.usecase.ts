import { CommandUseCase, Nanoid } from "contexts/Shared/domain";
import {
	IRecurrenceModificationsService,
	IScheduledTransactionsService,
} from "../domain";

export type CompleteItemRecurrenceUseCaseInput = {
	recurrenceId: Nanoid;
	n: number;
};

export class CompleteItemRecurrenceUseCase implements CommandUseCase<CompleteItemRecurrenceUseCaseInput> {
	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService,
		private readonly _recurrenceModificationsService: IRecurrenceModificationsService,
	) {}

	async execute({
		recurrenceId,
		n,
	}: CompleteItemRecurrenceUseCaseInput): Promise<void> {
		await this._scheduledTransactionsService.getByID(recurrenceId.value);

		await this._recurrenceModificationsService.markOccurrenceAsCompleted(
			recurrenceId,
			n,
		);
	}
}
