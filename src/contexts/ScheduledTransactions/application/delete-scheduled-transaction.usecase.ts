import { CommandUseCase, Nanoid } from "contexts/Shared/domain";
import { IScheduledTransactionsService } from "../domain";

export type DeleteScheduledTransactionUseCaseInput = {
	id: Nanoid;
};

export class DeleteScheduledTransactionUseCase
	implements CommandUseCase<DeleteScheduledTransactionUseCaseInput>
{
	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService
	) {}

	async execute({
		id,
	}: DeleteScheduledTransactionUseCaseInput): Promise<void> {
		await this._scheduledTransactionsService.delete(id);
	}
}
