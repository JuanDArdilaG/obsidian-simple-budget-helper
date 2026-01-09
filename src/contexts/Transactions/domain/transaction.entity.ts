import {
	DateValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { OperationType } from "contexts/Shared/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { ScheduledTransaction } from "../../ScheduledTransactions/domain";
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
		private readonly _store?: StringValueObject
	) {
		super(id, updatedAt);
		this.validateTransferOperation();
	}

	/**
	 * Validates that transfer operations have a toSplits array
	 */
	private validateTransferOperation(): void {
		if (this._operation.isTransfer()) {
			if (this._fromSplits.length === 0 || this._toSplits.length === 0) {
				throw new InvalidArgumentError(
					"Transaction",
					"toSplits",
					"Transfer operations must have a toSplits array"
				);
			}
			if (!this.fromAmount.equalTo(this.toAmount)) {
				throw new InvalidArgumentError(
					"Transaction",
					`from amount: ${this.fromAmount}. to amount: ${this.toAmount}`,
					"From amount and to amount should be the same"
				);
			}
		}
	}

	static fromScheduledTransaction(
		scheduledItem: ScheduledTransaction,
		date: TransactionDate
	): Transaction {
		return new Transaction(
			TransactionID.generate(),
			scheduledItem.fromSplits,
			scheduledItem.toSplits,
			scheduledItem.name,
			scheduledItem.operation.type,
			scheduledItem.category.category.id,
			scheduledItem.category.subCategory.id,
			date,
			DateValueObject.createNowDate(),
			scheduledItem.store
		);
	}

	static create(
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
			this._store
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

	get store(): StringValueObject | undefined {
		return this._store;
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
			name: this._name.value,
			category: this._category.value,
			subCategory: this._subCategory.value,
			fromSplits: this._fromSplits.map((s) => s.toPrimitives()),
			toSplits: this._toSplits.map((s) => s.toPrimitives()),
			operation: this._operation.value,
			date: this._date,
			updatedAt: this._updatedAt.toISOString(),
			store: this._store?.value,
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
		amount,
		operation,
		date,
		brand,
		store,
		updatedAt,
	}: TransactionPrimitives): Transaction {
		let _fromSplits: PaymentSplit[] = [];
		let _toSplits: PaymentSplit[] = [];
		if (fromSplits && fromSplits.length > 0) {
			_fromSplits = fromSplits.map(PaymentSplit.fromPrimitives);
		}
		if (toSplits && toSplits.length > 0) {
			_toSplits = toSplits.map(PaymentSplit.fromPrimitives);
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
			store ? new StringValueObject(store) : undefined
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
	operation: OperationType;
	date: Date;
	amount?: number;
	brand?: string;
	store?: string;
	updatedAt: string;
};
