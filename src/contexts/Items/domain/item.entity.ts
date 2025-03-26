import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemBrand } from "./item-brand.valueobject";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import { ItemStore } from "./item-store.valueobject";
import { ItemOperation } from "./item-operation.valueobject";
import { OperationType } from "contexts/Shared/domain/value-objects/operation.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories";

export class Item {
	constructor(
		protected _id: ItemID,
		protected _operation: ItemOperation,
		protected _name: ItemName,
		protected _price: ItemPrice,
		protected _category: CategoryID,
		protected _subCategory: SubCategoryID,
		protected _account: AccountID,
		protected _brand?: ItemBrand,
		protected _store?: ItemStore,
		protected _toAccount?: AccountID
	) {}

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

	get name(): ItemName {
		return this._name;
	}

	get toAccount(): AccountID | undefined {
		return this._toAccount;
	}

	get price(): ItemPrice {
		return this._price;
	}

	get realPrice(): ItemPrice {
		return this._operation.isIncome() || this._operation.isTransfer()
			? this._price
			: this._price.negate();
	}

	getRealPriceForAccount(accountID: AccountID): ItemPrice {
		return new ItemPrice(
			this._operation.isTransfer()
				? (accountID.equalTo(this._account)
						? -1
						: (
								this._toAccount
									? accountID.equalTo(this._toAccount)
									: false
						  )
						? 1
						: 0) * this._price.toNumber()
				: this._price.toNumber() *
				  (this._operation.isExpense() ? -1 : 1)
		);
	}

	set price(amount: ItemPrice) {
		this._price = amount;
	}

	get category(): CategoryID {
		return this._category;
	}

	get subCategory(): SubCategoryID {
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

	set account(account: AccountID) {
		this._account = account;
	}

	update({
		name,
		amount,
		category,
		subCategory,
		account,
		toAccount,
	}: {
		name?: ItemName;
		amount?: ItemPrice;
		category?: CategoryID;
		subCategory?: SubCategoryID;
		account?: AccountID;
		toAccount?: AccountID;
	}) {
		if (name) this._name = name;
		if (amount) this._price = amount;
		if (category) this._category = category;
		if (subCategory) this._subCategory = subCategory;
		if (account) this._account = account;
		if (toAccount) this._toAccount = toAccount;
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
			frequency: "",
			nextDate: new Date(),
			store: "",
			toAccount: "",
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
	nextDate?: Date;
	frequency?: string;
};

// export class BudgetItemValidator extends Validator<TBudgetItem, BudgetItem> {
// 	constructor() {
// 		super({
// 			id: (value) => value.id !== "",
// 			name: (value) => value.name !== "",
// 			account: (value) => value.account !== "",
// 			amount: (value) => !value.amount.isZero(),
// 			nextDate: (value) => value.nextDate !== null,
// 			category: (value) => value.category !== "",
// 			subcategory: (value) => value.subCategory !== "",
// 			brand: (_) => true,
// 			store: (_) => true,
// 			toAccount: (value) =>
// 				value.type !== "transfer" || value.toAccount !== "",
// 			path: (_) => true,
// 			history: (_) => true,
// 			type: (_) => true,
// 			frequency: () => true,
// 		});
// 	}
// }
