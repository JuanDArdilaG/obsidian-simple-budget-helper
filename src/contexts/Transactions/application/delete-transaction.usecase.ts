import { CommandUseCase } from "contexts/Shared/domain";
import { TransactionID } from "contexts/Transactions/domain";
import { TransactionsService } from "contexts/Transactions/application";

export type DeleteTransactionUseCaseInput = TransactionID;

export class DeleteTransactionUseCase
	implements CommandUseCase<DeleteTransactionUseCaseInput>
{
	constructor(private _transactionsService: TransactionsService) {}

	async execute(id: TransactionID): Promise<void> {
		await this._transactionsService.delete(id);
	}
}
