import { IService } from "contexts/Shared/domain";
import { ItemID } from "./item-id.valueobject";
import { Item, ItemPrimitives } from "./item.entity";
import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemRecurrenceModification } from ".";

export interface IItemsService extends IService<ItemID, Item, ItemPrimitives> {
	modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceModification
	): Promise<void>;
}
