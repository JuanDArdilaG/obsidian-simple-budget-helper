import { NumberValueObject } from "@juandardilag/value-objects";
import {
	Item,
	ItemID,
	ItemPrice,
	ItemPrimitives,
	ItemRecurrenceInfo,
} from "contexts/Items/domain";
import { IItemsService } from "contexts/Items/domain/items-service.interface";
import { Criteria } from "contexts/Shared/domain";

export class ItemsServiceMock implements IItemsService {
	constructor(public items: Item[]) {}
	getPricePerMonth(itemID: ItemID): Promise<ItemPrice> {
		throw new Error("Method not implemented.");
	}

	modifyRecurrence(
		id: ItemID,
		n: NumberValueObject,
		newRecurrence: ItemRecurrenceInfo
	): Promise<void> {
		throw new Error("Method not implemented.");
	}
	exists(id: ItemID): Promise<boolean> {
		throw new Error("Method not implemented.");
	}
	create(item: Item): Promise<void> {
		throw new Error("Method not implemented.");
	}
	getByID(id: ItemID): Promise<Item> {
		const item = this.items.find((i) => i.id.equalTo(id));
		if (!item) throw new Error("item not found on get");
		return Promise.resolve(item);
	}
	getByCriteria(criteria: Criteria<ItemPrimitives>): Promise<Item[]> {
		throw new Error("Method not implemented.");
	}
	getAll(): Promise<Item[]> {
		return Promise.resolve(this.items);
	}
	update(item: Item): Promise<void> {
		throw new Error("Method not implemented.");
	}
	delete(id: ItemID): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
