import { CommandUseCase, Nanoid } from "contexts/Shared/domain";
import { IScheduledTransactionsService } from "../domain";

export class DeleteScheduledTransactionUseCase implements CommandUseCase<Nanoid> {
	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService,
	) {}

	async execute(id: Nanoid): Promise<void> {
		await this._scheduledTransactionsService.delete(id.value);
	}
}
