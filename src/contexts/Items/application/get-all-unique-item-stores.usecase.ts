import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { IItemsRepository, ItemStore } from "contexts/Items/domain";

export type GetAllUniqueItemStoresUseCaseOutput = ItemStore[];

export class GetAllUniqueItemStoresUseCase
	implements QueryUseCase<void, GetAllUniqueItemStoresUseCaseOutput>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(): Promise<GetAllUniqueItemStoresUseCaseOutput> {
		return await this._itemsRepository.findAllUniqueItemStores();
	}
}
