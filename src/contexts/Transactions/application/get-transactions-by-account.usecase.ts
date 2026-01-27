import { Nanoid, QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	ITransactionsService,
	Transaction,
} from "contexts/Transactions/domain";

export class GetTransactionsByAccountUseCase implements QueryUseCase<
	Nanoid,
	Transaction[]
> {
	static readonly #logger = new Logger("GetTransactionsByAccountUseCase");
	constructor(private readonly _transactionsService: ITransactionsService) {}

	async execute(accountId: Nanoid): Promise<Transaction[]> {
		GetTransactionsByAccountUseCase.#logger.debug(
			"Fetching all transactions",
		);
		const allTransactions =
			await this._transactionsService.getByAccount(accountId);
		GetTransactionsByAccountUseCase.#logger.debug("transactions", {
			totalTransactions: allTransactions.length,
			transactions: allTransactions.map((t) => t.toPrimitives()),
		});

		return allTransactions;
	}
}
