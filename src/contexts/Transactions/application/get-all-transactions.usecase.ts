import { QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	ITransactionsRepository,
	Transaction,
} from "contexts/Transactions/domain";

export class GetAllTransactionsUseCase implements QueryUseCase<
	undefined,
	Transaction[]
> {
	static readonly #logger = new Logger("GetAllTransactionsUseCase");
	constructor(
		private readonly _transactionsRepository: ITransactionsRepository,
	) {}

	async execute(): Promise<Transaction[]> {
		GetAllTransactionsUseCase.#logger.debug("Fetching all transactions");
		const allTransactions = await this._transactionsRepository.findAll();

		GetAllTransactionsUseCase.#logger.debug("transactions", {
			totalTransactions: allTransactions.length,
			transactionsCount: allTransactions.length,
			transactions: allTransactions.map((t) => t.toPrimitives()),
		});

		return allTransactions;
	}
}
