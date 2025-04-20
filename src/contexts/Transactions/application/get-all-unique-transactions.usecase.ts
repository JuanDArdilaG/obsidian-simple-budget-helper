import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ITransactionsRepository, Transaction } from "../domain";

export type GetAllUniqueTransactionsByNameUseCaseOutput = {
	transactions: Transaction[];
};

export class GetAllUniqueTransactionsByNameUseCase
	implements QueryUseCase<void, GetAllUniqueTransactionsByNameUseCaseOutput>
{
	readonly #logger = new Logger("GetAllUniqueTransactionsByNameUseCase");
	constructor(
		private readonly _transactionsRepository: ITransactionsRepository
	) {}

	async execute(): Promise<GetAllUniqueTransactionsByNameUseCaseOutput> {
		const transactions = await this._transactionsRepository.findAll();
		this.#logger.debugB("get all transactions", { transactions }).log();
		return {
			transactions: transactions
				.filter((item, index, self) => {
					return (
						index ===
						self.findIndex((o) => o.name.equalTo(item.name))
					);
				})
				.sort((a, b) => a.name.value.localeCompare(b.name.value)),
		};
	}
}
