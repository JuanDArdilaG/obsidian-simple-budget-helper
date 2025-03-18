import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { ItemPrice } from "./item-price.valueobject";
import { Item } from "./item.entity";

export class SimpleItem extends Item {
	static IsSimple(item: Item): item is SimpleItem {
		return item instanceof SimpleItem;
	}

	updateOnRecord(isPermanent?: {
		amount?: ItemPrice;
		date?: DateValueObject;
	}): void {
		if (isPermanent?.amount) this._amount = isPermanent.amount;
	}
}
