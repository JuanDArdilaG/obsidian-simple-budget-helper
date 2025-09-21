import { ScheduledItem } from "contexts/Items/domain";
import { QueryUseCase } from "contexts/Shared/domain";
import { ItemsService } from "./items.service";

export type GetAllItemsUseCaseOutput = {
	items: ScheduledItem[];
};

export class GetAllItemsUseCase
	implements QueryUseCase<void, GetAllItemsUseCaseOutput>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute(): Promise<GetAllItemsUseCaseOutput> {
		return {
			items: await this._itemsService.getAll(),
		};
	}
}
