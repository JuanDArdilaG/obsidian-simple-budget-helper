import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { TransactionID } from "./transaction-id.valueobject";
import { TransactionOperation } from "./transaction-operation.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { TransactionDate } from "./transaction-date.valueobject";
import { TransactionAmount } from "./transaction-amount.valueobject";
import { Item } from "contexts/Items/domain/item.entity";
import { TransactionName } from "./item-name.valueobject";
import { OperationType } from "contexts/Shared/domain";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { ItemBrand, ItemProductInfo, ItemStore } from "contexts/Items/domain";
import { NumberValueObject } from "@juandardilag/value-objects";

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
		private readonly _item?: ItemID,
		private _toAccount?: AccountID,
		private readonly _productInfo?: ItemProductInfo
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
			amount
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

	get category(): CategoryID {
		return this._category;
	}

	updateCategory(category: CategoryID) {
		this._category = category;
	}

	get subCategory(): SubCategoryID {
		return this._subCategory;
	}

	updateSubCategory(subCategory: SubCategoryID) {
		this._subCategory = subCategory;
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
	}

	getRealAmountForAccount(accountID: AccountID): TransactionAmount {
		let multiplier = 1;
		if (this.operation.isTransfer()) {
			if (this.account.equalTo(accountID)) multiplier = -1;
			else if (this.toAccount)
				multiplier = this.toAccount.equalTo(accountID) ? 1 : 0;
		}
		if (this.operation.isExpense()) multiplier = -multiplier;
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
			brand || store
				? new ItemProductInfo({
						brand: brand ? new ItemBrand(brand) : undefined,
						store: store ? new ItemStore(store) : undefined,
				  })
				: undefined
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
