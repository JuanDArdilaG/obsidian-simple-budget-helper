import { Logger } from "../../Shared/infrastructure/logger";
import { IScheduledTransactionsService, ScheduledTransaction } from "../domain";

const logger = new Logger("CreateItemUseCase");

export class CreateScheduledItemUseCase {
	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService
	) {}

	async execute(scheduledTransaction: ScheduledTransaction): Promise<void> {
		logger.debug("scheduledTransaction to persist", {
			scheduledTransaction: scheduledTransaction.toPrimitives(),
		});

		await this._scheduledTransactionsService.create(scheduledTransaction);
	}
}
