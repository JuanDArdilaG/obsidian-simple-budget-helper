import { Nanoid, QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	ITransactionsService,
	Transaction,
} from "contexts/Transactions/domain";

export class GetTransactionsByCategoryUseCase implements QueryUseCase<
	Nanoid,
	Transaction[]
> {
	static readonly #logger = new Logger("GetTransactionsByCategoryUseCase");
	constructor(private readonly _transactionsService: ITransactionsService) {}

	async execute(categoryId: Nanoid): Promise<Transaction[]> {
		GetTransactionsByCategoryUseCase.#logger.debug(
			"Fetching all transactions",
		);
		const allTransactions =
			await this._transactionsService.getByCategory(categoryId);
		GetTransactionsByCategoryUseCase.#logger.debug("transactions", {
			totalTransactions: allTransactions.length,
			transactions: allTransactions.map((t) => t.toPrimitives()),
		});

		return allTransactions;
	}
}
