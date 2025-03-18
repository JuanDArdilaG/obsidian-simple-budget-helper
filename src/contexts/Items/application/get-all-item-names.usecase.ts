import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { ItemName } from "../domain/item-name.valueobject";
import { IItemsRepository } from "../domain/item-repository.interface";

export type GetAllItemNamesUseCaseOutput = ItemName[];

export class GetAllItemNamesUseCase
	implements QueryUseCase<void, GetAllItemNamesUseCaseOutput>
{
	constructor(private _itemsRepository: IItemsRepository) {}

	async execute(): Promise<GetAllItemNamesUseCaseOutput> {
		return await this._itemsRepository.getAllUniqueItemNames();
	}
}
