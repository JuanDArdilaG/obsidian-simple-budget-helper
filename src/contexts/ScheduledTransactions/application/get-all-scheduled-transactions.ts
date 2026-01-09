import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { IScheduledTransactionsService, ScheduledTransaction } from "../domain";

export class GetAllScheduledTransactionsUseCase
	implements QueryUseCase<void, ScheduledTransaction[]>
{
	readonly #logger = new Logger("GetScheduledTransactionsUntilDateUse");
	constructor(
		private readonly _scheduledTransactionsService: IScheduledTransactionsService
	) {}

	async execute(): Promise<ScheduledTransaction[]> {
		this.#logger.debug("execute");
		const scheduledTransactions =
			await this._scheduledTransactionsService.getAll();

		this.#logger.debug("scheduledTransactions from repository", {
			items: [...scheduledTransactions],
		});

		return scheduledTransactions;
	}
}
