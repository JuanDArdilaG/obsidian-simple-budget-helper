import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemBrand } from "./item-brand.valueobject";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import { ItemStore } from "./item-store.valueobject";
import { ItemOperation } from "../../Shared/domain/Item/item-operation.valueobject";
import { OperationType } from "contexts/Shared/domain/value-objects/operation.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";
import { Account } from "contexts/Accounts/domain";

export class Item extends Entity<ItemID, ItemPrimitives> {
	constructor(
		id: ItemID,
		protected _operation: ItemOperation,
		protected _name: ItemName,
		protected _price: ItemPrice,
		protected _category: CategoryID,
		protected _subCategory: SubCategoryID,
		protected _account: AccountID,
		protected _brand?: ItemBrand,
		protected _store?: ItemStore,
		protected _toAccount?: AccountID
	) {
		super(id);
	}

	static create(
		name: ItemName,
		amount: ItemPrice,
		operation: ItemOperation,
		category: CategoryID,
		subCategory: SubCategoryID,
		account: AccountID,
		brand?: ItemBrand,
		store?: ItemStore
	) {
		return new Item(
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

	static createExpenseItem(
		name: ItemName,
		amount: ItemPrice,
		category: CategoryID,
		subCategory: SubCategoryID,
		account: AccountID,
		brand?: ItemBrand,
		store?: ItemStore
	) {
		return new Item(
			ItemID.generate(),
			ItemOperation.expense(),
			name,
			amount,
			category,
			subCategory,
			account,
			brand,
			store
		);
	}

	static copyWithNegativeAmount(item: Item): Item {
		return new Item(
			ItemID.generate(),
			item._operation,
			item._name,
			item._price.negate(),
			item._category,
			item._subCategory,
			item._account,
			item._brand,
			item._store,
			item._toAccount
		);
	}

	get id(): ItemID {
		return this._id;
	}

	get operation(): ItemOperation {
		return this._operation;
	}

	updateOperation(operation: ItemOperation): void {
		this._operation = operation;
	}

	get name(): ItemName {
		return this._name;
	}

	updateName(name: ItemName): void {
		this._name = name;
	}

	get price(): ItemPrice {
		return this._price;
	}

	updatePrice(price: ItemPrice) {
		this._price = price;
	}

	get realPrice(): ItemPrice {
		return this._operation.isIncome()
			? this._price
			: this._operation.isExpense()
			? this._price.negate()
			: ItemPrice.zero();
	}

	getRealPriceForAccount(account: Account): PriceValueObject {
		return new PriceValueObject(
			this._operation.isTransfer()
				? (account.id.equalTo(this._account)
						? -1
						: (
								this._toAccount
									? account.id.equalTo(this._toAccount)
									: false
						  )
						? 1
						: 0) * this._price.toNumber()
				: this._price.toNumber() * (this._operation.isIncome() ? 1 : -1)
		).times(new NumberValueObject(account.type.isAsset() ? 1 : -1));
	}

	set price(amount: ItemPrice) {
		this._price = amount;
	}

	get category(): CategoryID {
		return this._category;
	}

	updateCategory(category: CategoryID): void {
		this._category = category;
	}

	get subCategory(): SubCategoryID {
		return this._subCategory;
	}

	updateSubCategory(subCategory: SubCategoryID): void {
		this._subCategory = subCategory;
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

	updateAccount(account: AccountID) {
		this._account = account;
	}

	get toAccount(): AccountID | undefined {
		return this._toAccount;
	}

	updateToAccount(toAccount: AccountID | undefined) {
		this._toAccount = toAccount;
	}

	toPrimitives(): ItemPrimitives {
		return {
			id: this._id.value,
			operation: this._operation.value,
			name: this._name.value,
			amount: this._price.valueOf(),
			category: this._category.value,
			subCategory: this._subCategory.value,
			brand: this._brand?.value,
			store: this._store?.value,
			account: this._account.value,
			toAccount: this.toAccount?.value,
		};
	}

	toOldPrimitives(): OldItemPrimitives {
		return {
			id: this._id.value,
			operation: this._operation.value,
			name: this._name.value,
			amount: this._price.valueOf(),
			category: this._category.value,
			subCategory: this._subCategory.value,
			brand: this._brand?.value,
			store: this._store?.value,
			account: this._account.value,
			toAccount: this.toAccount?.value,
			nextDate: new Date(),
		};
	}

	static emptyPrimitives(): ItemPrimitives {
		return {
			id: "",
			name: "",
			account: "",
			category: "",
			subCategory: "",
			amount: 0,
			operation: "expense",
			brand: "",
			store: "",
			toAccount: "",
		};
	}

	static emptyOldPrimitives(): OldItemPrimitives {
		return {
			id: "",
			name: "",
			account: "",
			category: "",
			subCategory: "",
			amount: 0,
			operation: "expense",
			brand: "",
			store: "",
			toAccount: "",
			nextDate: new Date(),
			frequency: "",
			untilDate: new Date(),
		};
	}
}

export type ItemPrimitives = {
	id: string;
	operation: OperationType;
	name: string;
	amount: number;
	category: string;
	subCategory: string;
	brand?: string;
	store?: string;
	account: string;
	toAccount?: string;
};

export type OldItemPrimitives = {
	id: string;
	operation: OperationType;
	name: string;
	amount: number;
	category: string;
	subCategory: string;
	brand?: string;
	store?: string;
	account: string;
	toAccount?: string;
	nextDate: Date;
	frequency?: string;
	untilDate?: Date;
};
