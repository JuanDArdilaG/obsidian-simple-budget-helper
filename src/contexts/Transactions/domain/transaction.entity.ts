import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { TransactionID } from "./transaction-id.valueobject";
import { TransactionOperation } from "./transaction-operation.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { TransactionDate } from "./transaction-date.valueobject";
import { TransactionAmount } from "./transaction-amount.valueobject";
import { ItemBrand } from "contexts/Items/domain/item-brand.valueobject";
import { ItemStore } from "contexts/Items/domain/item-store.valueobject";
import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { Item } from "contexts/Items/domain/item.entity";
import { RecurrentItem } from "contexts/Items/domain/recurrent-item/recurrent-item.entity";
import { TransactionCategory } from "./transaction-category.valueobject";
import { TransactionSubcategory } from "./transaction-subcategory.valueobject";
import { TransactionName } from "./item-name.valueobject";

export class Transaction {
	constructor(
		private _id: TransactionID,
		private _itemID: ItemID,
		private _account: AccountID,
		private _name: TransactionName,
		private _operation: TransactionOperation,
		private _category: TransactionCategory,
		private _subCategory: TransactionSubcategory,
		private _date: TransactionDate,
		private _amount: TransactionAmount,
		private _toAccount?: AccountID,
		private _brand?: ItemBrand,
		private _store?: ItemStore
	) {}

	static fromItem(item: Item): Transaction {
		return new Transaction(
			TransactionID.generate(),
			item.id,
			item.account,
			item.name,
			item.operation,
			item.category,
			item.subCategory,
			RecurrentItem.IsRecurrent(item)
				? item.nextDate
				: TransactionDate.now(),
			item.amount,
			item.operation.isTransfer() ? item.toAccount : undefined,
			item.brand,
			item.store
		);
	}

	// static create(item: TransactionPrimitives): Transaction {
	// 	return new Transaction(
	// 		item.id,
	// 		item.item,
	// 		item.account,
	// 		item.toAccount || "",
	// 		item.name,
	// 		item.type,
	// 		item.date,
	// 		new TransactionAmount(item.amount),
	// 		item.brand,
	// 		item.store
	// 	);
	// }

	get date(): TransactionDate {
		return this._date;
	}

	get operation(): TransactionOperation {
		return this._operation;
	}

	get category(): TransactionCategory {
		return this._category;
	}

	get subCategory(): TransactionSubcategory {
		return this._subCategory;
	}

	get amount(): TransactionAmount {
		return this._amount;
	}

	get realAmount(): TransactionAmount {
		return new TransactionAmount(
			this.amount.toNumber() *
				(this._operation.isExpense()
					? -1
					: this._operation.isIncome()
					? 1
					: 0)
		);
	}

	update(
		name: TransactionName,
		account: AccountID,
		date: DateValueObject,
		type: TransactionOperation,
		amount: TransactionAmount
	) {
		this._name = name;
		this._account = account;
		this._date = date;
		this._operation = type;
		this._amount = amount;
	}

	toString(): string {
		return `- id: ${this._id}. name: ${this._name}. account: ${
			this._account
		}. date: ${
			this._date.toString().split(" GMT")[0]
		}. amount: ${this._amount.toString()}${
			this._brand ? `. brand: ${this._brand}` : ""
		}${this._store ? `. store: ${this._store}` : ""}`;
	}

	toPrimitives(): TransactionPrimitives {
		return {
			id: this._id.value,
			item: this._itemID.value,
			name: this._name.value,
			account: this._account.value,
			toAccount: this._toAccount?.value,
			type: this._operation.value,
			date: this._date.valueOf(),
			amount: this._amount.valueOf(),
			brand: this._brand?.value,
			store: this._store?.value,
		};
	}
}

export type TransactionPrimitives = {
	id: string;
	item: string;
	name: string;
	account: string;
	toAccount?: string;
	type: string;
	date: Date;
	amount: number;
	brand?: string;
	store?: string;
};
