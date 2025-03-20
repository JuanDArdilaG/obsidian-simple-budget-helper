import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { IItemsRepository } from "../domain/item-repository.interface";
import { Item } from "../domain";

export type GetAllItemsUseCaseOutput = Item[];

export class GetAllItemsUseCase
	implements QueryUseCase<void, GetAllItemsUseCaseOutput>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(): Promise<GetAllItemsUseCaseOutput> {
		return await this._itemsRepository.findAll();
	}
}
