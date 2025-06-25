import { DateValueObject } from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { ItemBrand, ItemProductInfo, ItemStore } from "contexts/Items/domain";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { Item } from "contexts/Items/domain/item.entity";
import { OperationType } from "contexts/Shared/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { TransactionName } from "./item-name.valueobject";
import {
	PaymentSplit,
	PaymentSplitPrimitives,
} from "./payment-split.valueobject";
import { TransactionAmount } from "./transaction-amount.valueobject";
import { TransactionDate } from "./transaction-date.valueobject";
import { TransactionID } from "./transaction-id.valueobject";
import { TransactionOperation } from "./transaction-operation.valueobject";

export class Transaction extends Entity<TransactionID, TransactionPrimitives> {
	constructor(
		id: TransactionID,
		private _fromSplits: PaymentSplit[],
		private _toSplits: PaymentSplit[],
		private _name: TransactionName,
		private _operation: TransactionOperation,
		private _category: CategoryID,
		private _subCategory: SubCategoryID,
		private _date: TransactionDate,
		updatedAt: DateValueObject,
		private readonly _item?: ItemID,
		private readonly _productInfo?: ItemProductInfo
	) {
		super(id, updatedAt);
		this.validateTransferOperation();
	}

	/**
	 * Validates that transfer operations have a toSplits array
	 */
	private validateTransferOperation(): void {
		if (this._operation.isTransfer() && this._toSplits.length === 0) {
			throw new InvalidArgumentError(
				"Transaction",
				"toSplits",
				"Transfer operations must have a toSplits array"
			);
		}
	}

	static fromItem(item: Item, date: TransactionDate): Transaction {
		return new Transaction(
			TransactionID.generate(),
			item.fromSplits,
			item.toSplits,
			item.name,
			item.operation.type,
			item.category,
			item.subCategory,
			date,
			DateValueObject.createNowDate(),
			item.id,
			item.info
		);
	}

	static createWithoutItem(
		fromSplits: PaymentSplit[],
		toSplits: PaymentSplit[],
		name: TransactionName,
		operation: TransactionOperation,
		category: CategoryID,
		subCategory: SubCategoryID
	): Transaction {
		return new Transaction(
			TransactionID.generate(),
			fromSplits,
			toSplits,
			name,
			operation,
			category,
			subCategory,
			TransactionDate.createNowDate(),
			DateValueObject.createNowDate()
		);
	}

	copy(): Transaction {
		return new Transaction(
			TransactionID.generate(),
			[...this._fromSplits],
			[...this._toSplits],
			this._name,
			this._operation,
			this._category,
			this._subCategory,
			this._date,
			this._updatedAt,
			this._item,
			this._productInfo
		);
	}

	get fromSplits(): PaymentSplit[] {
		return this._fromSplits;
	}

	get fromAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._fromSplits);
	}

	get toSplits(): PaymentSplit[] {
		return this._toSplits;
	}

	get toAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._toSplits);
	}

	setFromSplits(splits: PaymentSplit[]): void {
		this._fromSplits = splits;
		this.updateTimestamp();
	}

	setToSplits(splits: PaymentSplit[]): void {
		this._toSplits = splits;
		this.validateTransferOperation();
		this.updateTimestamp();
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
		this.validateTransferOperation();
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

	get store(): ItemStore | undefined {
		return this._productInfo?.info.store;
	}

	get brand(): ItemBrand | undefined {
		return this._productInfo?.info.brand;
	}

	getRealAmountForAccount(accountID: AccountID): TransactionAmount {
		const fromSplits = this._fromSplits.filter((split) =>
			split.accountId.equalTo(accountID)
		);
		const toSplits = this._toSplits.filter((split) =>
			split.accountId.equalTo(accountID)
		);
		const totalTo = PaymentSplit.totalAmount(toSplits).toNumber();
		const totalFrom = PaymentSplit.totalAmount(fromSplits).toNumber();
		if (this._operation.value === "transfer") {
			return new TransactionAmount(totalTo - totalFrom);
		}
		return new TransactionAmount(
			this._operation.value === "expense" ? -totalFrom : totalFrom
		);
	}

	toPrimitives(): TransactionPrimitives {
		return {
			id: this._id.value,
			item: this._item?.value,
			name: this._name.value,
			category: this._category.value,
			subCategory: this._subCategory.value,
			fromSplits: this._fromSplits.map((s) => s.toPrimitives()),
			toSplits: this._toSplits.map((s) => s.toPrimitives()),
			operation: this._operation.value,
			date: this._date,
			brand: this._productInfo?.info.brand?.value,
			store: this._productInfo?.info.store?.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives({
		id,
		item,
		name,
		category,
		subCategory,
		fromSplits,
		toSplits,
		account,
		toAccount,
		amount,
		operation,
		date,
		brand,
		store,
		updatedAt,
	}: TransactionPrimitives): Transaction {
		// Backward compatibility: if fromSplits/toSplits are missing, use account/toAccount
		let _fromSplits: PaymentSplit[] = [];
		let _toSplits: PaymentSplit[] = [];
		if (fromSplits && fromSplits.length > 0) {
			_fromSplits = fromSplits.map(PaymentSplit.fromPrimitives);
		} else if (account) {
			_fromSplits = [
				new PaymentSplit(
					new AccountID(account),
					new TransactionAmount(amount ?? 0)
				),
			];
		}
		if (toSplits && toSplits.length > 0) {
			_toSplits = toSplits.map(PaymentSplit.fromPrimitives);
		} else if (toAccount) {
			_toSplits = [
				new PaymentSplit(
					new AccountID(toAccount),
					new TransactionAmount(amount ?? 0)
				),
			];
		}
		return new Transaction(
			new TransactionID(id),
			_fromSplits,
			_toSplits,
			new TransactionName(name),
			new TransactionOperation(operation),
			new CategoryID(category),
			new SubCategoryID(subCategory),
			new TransactionDate(new Date(date)),
			updatedAt
				? new DateValueObject(new Date(updatedAt))
				: DateValueObject.createNowDate(),
			item ? new ItemID(item) : undefined,
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
			category: "",
			subCategory: "",
			fromSplits: [],
			toSplits: [],
			operation: "expense",
			date: new Date(),
			amount: 0,
			brand: "",
			store: "",
			updatedAt: new Date().toISOString(),
		};
	}
}

export type TransactionPrimitives = {
	id: string;
	item?: string;
	name: string;
	category: string;
	subCategory: string;
	fromSplits?: PaymentSplitPrimitives[];
	toSplits?: PaymentSplitPrimitives[];
	account?: string;
	toAccount?: string;
	operation: OperationType;
	date: Date;
	amount?: number;
	brand?: string;
	store?: string;
	updatedAt: string;
};
