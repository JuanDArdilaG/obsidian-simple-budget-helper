import { CommandUseCase, Nanoid } from "contexts/Shared/domain";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";

export class DeleteTransactionUseCase implements CommandUseCase<Nanoid> {
	constructor(private readonly _transactionsService: TransactionsService) {}

	async execute(id: Nanoid): Promise<void> {
		await this._transactionsService.delete(id);
	}
}
