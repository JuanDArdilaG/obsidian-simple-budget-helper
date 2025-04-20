import { CommandUseCase } from "contexts/Shared/domain";
import { Item, ItemRecurrence } from "contexts/Items/domain";
import { ItemsService } from "./items.service";

export type UpdateItemUseCaseInput = Item;

export class UpdateItemUseCase
	implements CommandUseCase<UpdateItemUseCaseInput>
{
	constructor(private readonly _itemsService: ItemsService) {}

	async execute(item: Item): Promise<void> {
		if (item.recurrence)
			item.updateRecurrence(
				new ItemRecurrence(
					item.id,
					item.date,
					item.recurrence.frequency,
					undefined,
					item.recurrence.untilDate
				)
			);
		await this._itemsService.update(item);
	}
}
