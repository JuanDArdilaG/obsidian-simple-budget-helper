import { QueryUseCase } from "contexts/Shared/domain";
import { Item } from "contexts/Items/domain";
import { ItemsService } from "./items.service";

export type GetAllItemsUseCaseOutput = {
	items: Item[];
};

export class GetAllItemsUseCase
	implements QueryUseCase<void, GetAllItemsUseCaseOutput>
{
	constructor(private _itemsService: ItemsService) {}

	async execute(): Promise<GetAllItemsUseCaseOutput> {
		return {
			items: await this._itemsService.getAll(),
		};
	}
}
