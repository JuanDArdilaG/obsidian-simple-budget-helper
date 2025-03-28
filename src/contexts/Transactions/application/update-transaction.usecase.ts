import { CommandUseCase } from "contexts/Shared/domain";
import { Transaction } from "contexts/Transactions/domain";
import { TransactionsService } from "./transactions.service";

export type UpdateTransactionUseCaseInput = Transaction;

export class UpdateTransactionUseCase
	implements CommandUseCase<UpdateTransactionUseCaseInput>
{
	constructor(private _transactionsService: TransactionsService) {}

	async execute(transaction: Transaction): Promise<void> {
		await this._transactionsService.update(transaction);
	}
}
