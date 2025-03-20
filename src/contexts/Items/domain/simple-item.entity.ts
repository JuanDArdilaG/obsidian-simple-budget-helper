import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { ItemPrice } from "./item-price.valueobject";
import { Item, ItemPrimitives } from "./item.entity";
import { ItemID } from "./item-id.valueobject";
import { ItemOperation } from "./item-operation.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemBrand } from "./item-brand.valueobject";
import { ItemCategory } from "./item-category.valueobject";
import { ItemName } from "./item-name.valueobject";
import { ItemStore } from "./item-store.valueobject";
import { ItemSubcategory } from "./item-subcategory.valueobject";

export class SimpleItem extends Item {
	static IsSimple(item: Item): item is SimpleItem {
		return item instanceof SimpleItem;
	}

	static create(
		name: ItemName,
		amount: ItemPrice,
		operation: ItemOperation,
		category: ItemCategory,
		subCategory: ItemSubcategory,
		account: AccountID,
		brand?: ItemBrand,
		store?: ItemStore
	): SimpleItem {
		return new SimpleItem(
			ItemID.generate(),
			operation,
			name,
			amount,
			category,
			subCategory,
			account,
			brand,
			store
		);
	}

	updateOnRecord(isPermanent?: {
		amount?: ItemPrice;
		date?: DateValueObject;
	}): void {
		if (isPermanent?.amount) this._amount = isPermanent.amount;
	}

	static fromPrimitives({
		id,
		operation,
		name,
		amount,
		category,
		subCategory,
		brand,
		store,
		account,
		toAccount,
	}: ItemPrimitives): SimpleItem {
		return new SimpleItem(
			new ItemID(id),
			new ItemOperation(operation),
			new ItemName(name),
			new ItemPrice(amount),
			new ItemCategory(category),
			new ItemSubcategory(subCategory),
			new AccountID(account),
			brand ? new ItemBrand(brand) : undefined,
			store ? new ItemStore(store) : undefined,
			toAccount ? new AccountID(toAccount) : undefined
		);
	}
}
