import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { ItemStore } from "contexts/Items/domain";
import { ITransactionsRepository } from "../domain";

export type GetAllUniqueItemStoresUseCaseOutput = ItemStore[];

export class GetAllUniqueItemStoresUseCase
	implements QueryUseCase<void, GetAllUniqueItemStoresUseCaseOutput>
{
	constructor(
		private readonly _transactionsRepository: ITransactionsRepository
	) {}

	async execute(): Promise<GetAllUniqueItemStoresUseCaseOutput> {
		return await this._transactionsRepository.findAllUniqueItemStores();
	}
}
