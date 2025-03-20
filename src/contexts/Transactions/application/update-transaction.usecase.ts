import { CommandUseCase, EntityNotFoundError } from "contexts/Shared/domain";
import {
	ITransactionsRepository,
	Transaction,
} from "contexts/Transactions/domain";

export type UpdateTransactionUseCaseInput = Transaction;

export class UpdateTransactionUseCase
	implements CommandUseCase<UpdateTransactionUseCaseInput>
{
	constructor(private _transactionsRepository: ITransactionsRepository) {}

	async execute(transaction: Transaction): Promise<void> {
		const existingTransaction = await this._transactionsRepository.findById(
			transaction.id
		);
		if (!existingTransaction)
			throw new EntityNotFoundError("Transaction", transaction.id);

		await this._transactionsRepository.persist(transaction);
	}
}
