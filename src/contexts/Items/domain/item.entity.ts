import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemBrand } from "./item-brand.valueobject";
import { ItemCategory } from "./item-category.valueobject";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import { ItemStore } from "./item-store.valueobject";
import { ItemSubcategory } from "./item-subcategory.valueobject";
import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { ItemOperation } from "./item-operation.valueobject";

export abstract class Item {
	constructor(
		protected _id: ItemID,
		protected _operation: ItemOperation,
		protected _name: ItemName,
		protected _amount: ItemPrice,
		protected _category: ItemCategory,
		protected _subCategory: ItemSubcategory,
		protected _account: AccountID,
		protected _brand?: ItemBrand,
		protected _store?: ItemStore,
		protected _toAccount?: AccountID
	) {}

	// static createExpenseItem(
	// 	name: ItemName,
	// 	amount: ItemPrice,
	// 	category: ItemCategory,
	// 	subCategory: ItemSubcategory,
	// 	account: AccountID,
	// 	brand?: ItemBrand,
	// 	store?: ItemStore
	// ) {
	// 	return new Item(
	// 		ItemID.generate(),
	// 		ItemOperation.expense(),
	// 		name,
	// 		amount,
	// 		category,
	// 		subCategory,
	// 		account,
	// 		brand,
	// 		store
	// 	);
	// }

	get id(): ItemID {
		return this._id;
	}

	setRandomId() {
		this._id = ItemID.generate();
	}

	get operation(): ItemOperation {
		return this._operation;
	}

	get name(): ItemName {
		return this._name;
	}

	get toAccount(): AccountID | undefined {
		return this._toAccount;
	}

	get amount(): ItemPrice {
		return this._amount;
	}

	get category(): ItemCategory {
		return this._category;
	}

	get subCategory(): ItemSubcategory {
		return this._subCategory;
	}

	get brand(): ItemBrand | undefined {
		return this._brand;
	}

	get store(): ItemStore | undefined {
		return this._store;
	}

	get account(): AccountID {
		return this._account;
	}

	update({
		name,
		amount,
		category,
		account,
		toAccount,
	}: {
		name?: ItemName;
		amount?: ItemPrice;
		category?: ItemCategory;
		account?: AccountID;
		toAccount?: AccountID;
	}) {
		if (name) this._name = name;
		if (amount) this._amount = amount;
		if (category) this._category = category;
		if (account) this._account = account;
		if (toAccount) this._toAccount = toAccount;
	}

	// TODO: refactor
	// abstract record(
	// 	date: DateValueObject,
	// 	account: AccountID,
	// 	amount?: ItemPrice,
	// 	isPermanent?: boolean
	// ): void;

	abstract updateOnRecord(isPermanent?: {
		amount?: ItemPrice;
		date?: DateValueObject;
	}): void;

	// abstract updateHistoryRecord(
	// 	id: TransactionID,
	// 	name: ItemName,
	// 	account: AccountID,
	// 	date: Date,
	// 	type: TransactionOperation,
	// 	amount: ItemPrice,
	// 	category: ItemCategory,
	// 	subCategory: ItemSubcategory
	// ): void;

	// abstract removeHistoryRecord(id: TransactionID): void;

	toJSON(): ItemPrimitives {
		return {
			id: this._id.value,
			operation: this._operation.value,
			name: this._name.value,
			amount: this._amount.valueOf(),
			category: this._category.value,
			subCategory: this._subCategory.value,
			brand: this._brand?.value,
			store: this._store?.value,
			account: this._account.value,
			toAccount: this._account.value,
		};
	}
}

export type ItemPrimitives = {
	id: string;
	operation: string;
	name: string;
	amount: number;
	category: string;
	subCategory: string;
	brand?: string;
	store?: string;
	account: string;
	toAccount: string;
};
