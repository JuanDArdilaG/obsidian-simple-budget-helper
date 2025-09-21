import { CommandUseCase } from "contexts/Shared/domain";
import { Transaction } from "contexts/Transactions/domain";
import { TransactionsService } from "contexts/Transactions/application/transactions.service";

export type RecordTransactionUseCaseInput = Transaction;

export class RecordTransactionUseCase
	implements CommandUseCase<RecordTransactionUseCaseInput>
{
	constructor(private readonly _transactionsService: TransactionsService) {}

	async execute(transaction: Transaction): Promise<void> {
		await this._transactionsService.record(transaction);
	}
}
