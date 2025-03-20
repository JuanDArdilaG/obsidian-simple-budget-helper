import { CommandUseCase } from "contexts/Shared/domain";
import {
	ITransactionsRepository,
	TransactionID,
} from "contexts/Transactions/domain";

export type DeleteTransactionUseCaseInput = TransactionID;

export class DeleteTransactionUseCase
	implements CommandUseCase<DeleteTransactionUseCaseInput>
{
	constructor(private _transactionsRepository: ITransactionsRepository) {}

	async execute(id: TransactionID): Promise<void> {
		await this._transactionsRepository.deleteById(id);
	}
}
