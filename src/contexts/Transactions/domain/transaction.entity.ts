import {
	DateValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { ItemBrand, ItemProductInfo, ItemStore } from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { Item } from "contexts/Items/domain/item.entity";
import { OperationType } from "contexts/Shared/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { TransactionName } from "./item-name.valueobject";
import { TransactionAmount } from "./transaction-amount.valueobject";
import { TransactionDate } from "./transaction-date.valueobject";
import { TransactionID } from "./transaction-id.valueobject";
import { TransactionOperation } from "./transaction-operation.valueobject";

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
		updatedAt: DateValueObject,
		private readonly _item?: ItemID,
		private _toAccount?: AccountID,
		private readonly _productInfo?: ItemProductInfo
	) {
		super(id, updatedAt);
	}

	static fromItem(item: Item, date: TransactionDate): Transaction {
		return new Transaction(
			TransactionID.generate(),
			item.operation.account,
			item.name,
			item.operation.type,
			item.category,
			item.subCategory,
			date,
			item.price,
			DateValueObject.createNowDate(),
			item.id,
			item.operation.type.isTransfer()
				? item.operation.toAccount
				: undefined,
			item.info
		);
	}

	static createWithoutItem(
		account: AccountID,
		name: TransactionName,
		operation: TransactionOperation,
		category: CategoryID,
		subCategory: SubCategoryID,
		amount: TransactionAmount
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
			DateValueObject.createNowDate()
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
			this._updatedAt,
			this._item,
			this._toAccount,
			this._productInfo
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
			this._updatedAt,
			this._item,
			this._toAccount,
			this._productInfo
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
		this.updateTimestamp();
	}

	get date(): TransactionDate {
		return this._date;
	}

	updateDate(date: TransactionDate): void {
		this._date = date;
		this.updateTimestamp();
	}

	get operation(): TransactionOperation {
		return this._operation;
	}

	updateOperation(operation: TransactionOperation): void {
		this._operation = operation;
		this.updateTimestamp();
	}

	get account(): AccountID {
		return this._account;
	}

	get toAccount(): AccountID | undefined {
		return this._toAccount;
	}

	updateAccount(account: AccountID): void {
		this._account = account;
		this.updateTimestamp();
	}

	updateToAccount(toAccount?: AccountID): void {
		this._toAccount = toAccount;
		this.updateTimestamp();
	}

	get category(): CategoryID {
		return this._category;
	}

	updateCategory(category: CategoryID) {
		this._category = category;
		this.updateTimestamp();
	}

	get subCategory(): SubCategoryID {
		return this._subCategory;
	}

	updateSubCategory(subCategory: SubCategoryID) {
		this._subCategory = subCategory;
		this.updateTimestamp();
	}

	get amount(): TransactionAmount {
		return this._amount;
	}

	get realAmount(): TransactionAmount {
		if (this.operation.isTransfer()) return TransactionAmount.zero();
		return this._amount.times(
			this.operation.isExpense()
				? new NumberValueObject(-1)
				: new NumberValueObject(1)
		);
	}

	updateAmount(amount: TransactionAmount) {
		this._amount = amount;
		this.updateTimestamp();
	}

	getRealAmountForAccount(accountID: AccountID): TransactionAmount {
		let multiplier = 1;
		if (this.operation.isTransfer()) {
			if (this.account.equalTo(accountID)) multiplier = -1;
			else if (this.toAccount?.equalTo(accountID)) multiplier = 1;
			else multiplier = 0;
		} else if (this.operation.isExpense()) multiplier = -multiplier;
		return new TransactionAmount(this._amount.toNumber() * multiplier);
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
			amount: this._amount.value,
			brand: this._productInfo?.value.brand?.value,
			store: this._productInfo?.value.store?.value,
			category: this._category.value,
			subCategory: this._subCategory.value,
			updatedAt: this._updatedAt.toISOString(),
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
		updatedAt,
	}: TransactionPrimitives): Transaction {
		const transaction = new Transaction(
			new TransactionID(id),
			new AccountID(account),
			new TransactionName(name),
			new TransactionOperation(operation),
			new CategoryID(category),
			new SubCategoryID(subCategory),
			new TransactionDate(new Date(date)),
			new TransactionAmount(amount),
			updatedAt
				? new DateValueObject(new Date(updatedAt))
				: DateValueObject.createNowDate(),
			item ? new ItemID(item) : undefined,
			toAccount ? new AccountID(toAccount) : undefined,
			brand || store
				? new ItemProductInfo({
						brand: brand ? new ItemBrand(brand) : undefined,
						store: store ? new ItemStore(store) : undefined,
				  })
				: undefined
		);
		return transaction;
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
			updatedAt: new Date().toISOString(),
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
	updatedAt: string;
};
