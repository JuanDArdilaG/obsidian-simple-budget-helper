import { QueryUseCase } from "contexts/Shared/domain";
import {
	ITransactionsRepository,
	Transaction,
} from "contexts/Transactions/domain";

export type GetAllTransactionsUseCaseOutput = Transaction[];

export class GetAllTransactionsUseCase
	implements QueryUseCase<undefined, GetAllTransactionsUseCaseOutput>
{
	constructor(private _transactionsRepository: ITransactionsRepository) {}

	async execute(): Promise<GetAllTransactionsUseCaseOutput> {
		return await this._transactionsRepository.findAll();
	}
}
