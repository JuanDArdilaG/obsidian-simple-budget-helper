import { ItemID } from "contexts/SimpleItems/domain/item-id.valueobject";
import { TransactionID } from "./transaction-id.valueobject";
import { TransactionOperation } from "./transaction-operation.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { TransactionDate } from "./transaction-date.valueobject";
import { TransactionAmount } from "./transaction-amount.valueobject";
import { ItemBrand } from "contexts/SimpleItems/domain/item-brand.valueobject";
import { ItemStore } from "contexts/SimpleItems/domain/item-store.valueobject";
import { Item } from "contexts/SimpleItems/domain/item.entity";
import { TransactionName } from "./item-name.valueobject";
import { OperationType } from "contexts/Shared/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";

export class Transaction extends Entity<TransactionID, TransactionPrimitives> {
	constructor(
		id: TransactionID,
		private _account: AccountID,
		private _name: TransactionName,
		private _operation: TransactionOperation,
		private _category: CategoryID,
		private _subCategory: SubCategoryID,
		private _date: TransactionDate,
		private _amount: TransactionAmount,
		private _item?: ItemID,
		private _toAccount?: AccountID,
		private _brand?: ItemBrand,
		private _store?: ItemStore
	) {
		super(id);
	}

	static fromItem(item: Item, date: TransactionDate): Transaction {
		return new Transaction(
			TransactionID.generate(),
			item.account,
			item.name,
			item.operation,
			item.category,
			item.subCategory,
			date,
			item.price,
			item.id,
			item.operation.isTransfer() ? item.toAccount : undefined,
			item.brand,
			item.store
		);
	}

	static createWithoutItem(
		account: AccountID,
		name: TransactionName,
		operation: TransactionOperation,
		category: CategoryID,
		subCategory: SubCategoryID,
		amount: TransactionAmount,
		toAccount?: AccountID,
		brand?: ItemBrand,
		store?: ItemStore
	): Transaction {
		return new Transaction(
			TransactionID.generate(),
			account,
			name,
			operation,
			category,
			subCategory,
			TransactionDate.createNowDate(),
			amount,
			undefined,
			toAccount,
			brand,
			store
		);
	}

	copy(): Transaction {
		return new Transaction(
			TransactionID.generate(),
			this._account,
			this._name,
			this._operation,
			this._category,
			this._subCategory,
			this._date,
			this._amount,
			this._item,
			this._toAccount,
			this._brand,
			this._store
		);
	}

	copyWithNegativeAmount(): Transaction {
		return new Transaction(
			TransactionID.generate(),
			this._account,
			this._name,
			this._operation,
			this._category,
			this._subCategory,
			this._date,
			this._amount.negate(),
			this._item,
			this._toAccount,
			this._brand,
			this._store
		);
	}

	get id(): TransactionID {
		return this._id;
	}

	get itemID(): ItemID | undefined {
		return this._item;
	}

	get name(): TransactionName {
		return this._name;
	}

	updateName(name: TransactionName): void {
		this._name = name;
	}

	get date(): TransactionDate {
		return this._date;
	}

	updateDate(date: TransactionDate): void {
		this._date = date;
	}

	get operation(): TransactionOperation {
		return this._operation;
	}

	updateOperation(operation: TransactionOperation): void {
		this._operation = operation;
	}

	get account(): AccountID {
		return this._account;
	}

	get toAccount(): AccountID | undefined {
		return this._toAccount;
	}

	updateAccount(account: AccountID): void {
		this._account = account;
	}

	updateToAccount(toAccount?: AccountID): void {
		this._toAccount = toAccount;
	}

	get categoryID(): CategoryID {
		return this._category;
	}

	get subCategory(): SubCategoryID {
		return this._subCategory;
	}

	get amount(): TransactionAmount {
		return this._amount;
	}

	updateAmount(amount: TransactionAmount) {
		this._amount = amount;
	}

	getRealAmountForAccount(accountID: AccountID): TransactionAmount {
		return new TransactionAmount(
			this.operation.isTransfer()
				? (accountID.equalTo(this.account)
						? -1
						: (
								this.toAccount
									? accountID.equalTo(this.toAccount)
									: false
						  )
						? 1
						: 0) * this.amount.toNumber()
				: this.amount.toNumber() *
				  (this._operation.isExpense() ? -1 : 1)
		);
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
			item: this._item?.value,
			name: this._name.value,
			account: this._account.value,
			toAccount: this._toAccount?.value,
			operation: this._operation.value,
			date: this._date,
			amount: this._amount.valueOf(),
			brand: this._brand?.value,
			store: this._store?.value,
			category: this._category.value,
			subCategory: this._subCategory.value,
		};
	}

	static fromPrimitives({
		id,
		item,
		name,
		account,
		toAccount,
		operation,
		date,
		amount,
		brand,
		store,
		category,
		subCategory,
	}: TransactionPrimitives): Transaction {
		return new Transaction(
			new TransactionID(id),
			new AccountID(account),
			new TransactionName(name),
			new TransactionOperation(operation),
			new CategoryID(category),
			new SubCategoryID(subCategory),
			new TransactionDate(date),
			new TransactionAmount(amount),
			item ? new ItemID(item) : undefined,
			toAccount ? new AccountID(toAccount) : undefined,
			brand ? new ItemBrand(brand) : undefined,
			store ? new ItemStore(store) : undefined
		);
	}

	static emptyPrimitives(): TransactionPrimitives {
		return {
			id: "",
			name: "",
			account: "",
			toAccount: "",
			operation: "expense",
			date: new Date(),
			amount: 0,
			brand: "",
			store: "",
			category: "",
			subCategory: "",
		};
	}
}

export type TransactionPrimitives = {
	id: string;
	item?: string;
	name: string;
	account: string;
	category: string;
	subCategory: string;
	toAccount?: string;
	operation: OperationType;
	date: Date;
	amount: number;
	brand?: string;
	store?: string;
};
