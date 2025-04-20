import { Service } from "contexts/Shared/application/service.abstract";
import {
	IItemsRepository,
	ItemID,
	ItemPrimitives,
	Item,
} from "contexts/Items/domain";
import { NumberValueObject } from "@juandardilag/value-objects";
import { RecurrenceModifications } from "../domain/item-recurrence-modification.valueobject";
import { InvalidArgumentError } from "contexts/Shared/domain";

export class ItemsService extends Service<ItemID, Item, ItemPrimitives> {
	constructor(private _itemsRepository: IItemsRepository) {
		super("Item", _itemsRepository);
	}

	async modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		modifications: RecurrenceModifications
	): Promise<void> {
		const item = await this.getByID(id);
		if (!item.recurrence)
			throw new InvalidArgumentError(
				"Scheduled Item",
				id.toString(),
				"item doesn't have recurrence"
			);
		item.recurrence.addModification(n, modifications);
		await this._itemsRepository.persist(item);
	}
}
