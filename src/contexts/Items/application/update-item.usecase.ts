import { CommandUseCase } from "contexts/Shared/domain";
import { Item } from "contexts/Items/domain";
import { ItemsService } from "./items.service";

export type UpdateItemUseCaseInput = Item;

export class UpdateItemUseCase
	implements CommandUseCase<UpdateItemUseCaseInput>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute(item: Item): Promise<void> {
		await this._itemsService.update(item);
	}
}
