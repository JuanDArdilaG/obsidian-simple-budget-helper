import { CommandUseCase } from "../../Shared/domain";
import { IScheduledTransactionsService, ScheduledTransaction } from "../domain";

export class EditScheduledTransactionUseCase implements CommandUseCase<{
	scheduledTransaction: ScheduledTransaction;
}> {
	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService,
	) {}

	async execute({
		scheduledTransaction,
	}: {
		scheduledTransaction: ScheduledTransaction;
	}): Promise<void> {
		await this._scheduledTransactionsService.update(scheduledTransaction);
	}
}
