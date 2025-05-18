import { IService } from "contexts/Shared/domain";
import { ItemID } from "./item-id.valueobject";
import { Item, ItemPrimitives } from "./item.entity";
import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemRecurrenceInfo } from "./item-recurrence-modification.valueobject";

export interface IItemsService extends IService<ItemID, Item, ItemPrimitives> {
	modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceInfo
	): Promise<void>;
}
