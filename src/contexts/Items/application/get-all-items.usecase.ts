import { QueryUseCase } from "contexts/Shared/domain/query-use-case.interface";
import { Item } from "contexts/Items/domain";
import { ItemsService } from "contexts/Items/application";

export type GetAllItemsUseCaseOutput = Item[];

export class GetAllItemsUseCase
	implements QueryUseCase<void, GetAllItemsUseCaseOutput>
{
	constructor(private _itemsService: ItemsService) {}

	async execute(): Promise<GetAllItemsUseCaseOutput> {
		return await this._itemsService.getAll();
	}
}
