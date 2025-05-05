import { Service } from "contexts/Shared/application/service.abstract";
import {
	IItemsRepository,
	ItemID,
	ItemPrimitives,
	Item,
	ItemRecurrenceModification,
} from "contexts/Items/domain";
import { NumberValueObject } from "@juandardilag/value-objects";
import { InvalidArgumentError } from "contexts/Shared/domain";
import { IItemsService } from "../domain/items-service.interface";

export class ItemsService
	extends Service<ItemID, Item, ItemPrimitives>
	implements IItemsService
{
	constructor(private readonly _itemsRepository: IItemsRepository) {
		super("Item", _itemsRepository);
	}

	async modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceModification
	): Promise<void> {
		const item = await this.getByID(id);
		if (!item.recurrence)
			throw new InvalidArgumentError(
				"Scheduled Item",
				id.toString(),
				"item doesn't have recurrence"
			);
		item.recurrences[n.value] = newRecurrence;
		await this._itemsRepository.persist(item);
	}
}
