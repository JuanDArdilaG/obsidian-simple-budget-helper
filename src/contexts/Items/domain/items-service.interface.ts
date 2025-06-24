import { NumberValueObject } from "@juandardilag/value-objects";
import { IService } from "contexts/Shared/domain";
import { ItemID } from "./item-id.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import { ItemRecurrenceInfo } from "./item-recurrence-modification.valueobject";
import { Item, ItemPrimitives } from "./item.entity";

export interface IItemsService extends IService<ItemID, Item, ItemPrimitives> {
	modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceInfo
	): Promise<void>;

	getPricePerMonth(itemID: ItemID): Promise<ItemPrice>;
}
