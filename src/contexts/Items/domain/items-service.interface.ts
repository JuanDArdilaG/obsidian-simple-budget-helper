import { NumberValueObject } from "@juandardilag/value-objects";
import { IService } from "contexts/Shared/domain";
import { PaymentSplit } from "contexts/Transactions/domain/payment-split.valueobject";
import { ItemID } from "./item-id.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import { ItemRecurrenceInfo } from "./item-recurrence-modification.valueobject";
import {
	ScheduledItem,
	ScheduledItemPrimitives,
} from "./scheduled-item.entity";

export interface IItemsService
	extends IService<ItemID, ScheduledItem, ScheduledItemPrimitives> {
	modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceInfo,
		fromSplits?: PaymentSplit[],
		toSplits?: PaymentSplit[]
	): Promise<void>;

	getPricePerMonth(itemID: ItemID): Promise<ItemPrice>;
}
