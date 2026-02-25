import { Nanoid, QueryUseCase } from "contexts/Shared/domain";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	ITransactionsService,
	Transaction,
} from "contexts/Transactions/domain";

export class GetTransactionsBySubcategoryUseCase implements QueryUseCase<
	Nanoid,
	Transaction[]
> {
	static readonly #logger = new Logger("GetTransactionsBySubcategoryUseCase");
	constructor(private readonly _transactionsService: ITransactionsService) {}

	async execute(subcategoryId: Nanoid): Promise<Transaction[]> {
		GetTransactionsBySubcategoryUseCase.#logger.debug(
			"Fetching all transactions",
		);
		const allTransactions =
			await this._transactionsService.getBySubCategory(subcategoryId);

		GetTransactionsBySubcategoryUseCase.#logger.debug("transactions", {
			totalTransactions: allTransactions.length,
			transactions: allTransactions.map((t) => t.toPrimitives()),
		});

		return allTransactions;
	}
}
