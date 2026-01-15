import {
	DateValueObject,
	NumberValueObject,
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
		private _originAccounts: PaymentSplit[],
		private _destinationAccounts: PaymentSplit[],
		private _name: TransactionName,
		private _operation: TransactionOperation,
		private _category: CategoryID,
		private _subCategory: SubCategoryID,
		private _date: TransactionDate,
		updatedAt: DateValueObject,
		private readonly _store?: StringValueObject,
		private _exchangeRate?: NumberValueObject
	) {
		super(id, updatedAt);
		this.validateTransferOperation();
	}

	/**
	 * Validates that transfer operations have a toSplits array
	 */
	private validateTransferOperation(): void {
		if (this._operation.isTransfer()) {
			if (
				this._originAccounts.length === 0 ||
				this._destinationAccounts.length === 0
			) {
				throw new InvalidArgumentError(
					"Transaction",
					"toSplits",
					"Transfer operations must have a toSplits array"
				);
			}
			if (!this.originAmount.equalTo(this.destinationAmount)) {
				throw new InvalidArgumentError(
					"Transaction",
					`from amount: ${this.originAmount}. to amount: ${this.destinationAmount}`,
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
			scheduledItem.originAccounts,
			scheduledItem.destinationAccounts,
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

	get originAccounts(): PaymentSplit[] {
		return this._originAccounts;
	}

	get originAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._originAccounts);
	}

	get destinationAccounts(): PaymentSplit[] {
		return this._destinationAccounts;
	}

	get destinationAmount(): TransactionAmount {
		return PaymentSplit.totalAmount(this._destinationAccounts);
	}

	setOriginAccounts(splits: PaymentSplit[]): void {
		this._originAccounts = splits;
		this.updateTimestamp();
	}

	setDestinationAccounts(splits: PaymentSplit[]): void {
		this._destinationAccounts = splits;
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

	get exchangeRate(): NumberValueObject {
		return this._exchangeRate ?? new NumberValueObject(1);
	}

	updateExchangeRate(exchangeRate: NumberValueObject) {
		this._exchangeRate = exchangeRate;
		this.updateTimestamp();
	}

	getRealAmountForAccount(accountID: AccountID): TransactionAmount {
		const originAccounts = this._originAccounts.filter((split) =>
			split.accountId.equalTo(accountID)
		);
		const destinationAccounts = this._destinationAccounts.filter((split) =>
			split.accountId.equalTo(accountID)
		);

		const originTotal = PaymentSplit.totalAmount(originAccounts).toNumber();
		const destinationTotal = PaymentSplit.totalAmount(
			destinationAccounts,
			this._exchangeRate
		).toNumber();

		if (this._operation.isTransfer()) {
			return new TransactionAmount(destinationTotal - originTotal);
		}
		return new TransactionAmount(
			this._operation.isExpense() ? -originTotal : originTotal
		);
	}

	toPrimitives(): TransactionPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
			category: this._category.value,
			subCategory: this._subCategory.value,
			fromSplits: this._originAccounts.map((s) => s.toPrimitives()),
			toSplits: this._destinationAccounts.map((s) => s.toPrimitives()),
			operation: this._operation.value,
			date: this._date,
			updatedAt: this._updatedAt.toISOString(),
			store: this._store?.value,
			exchangeRate: this._exchangeRate?.value,
		};
	}

	static fromPrimitives({
		id,
		name,
		category,
		subCategory,
		fromSplits,
		toSplits,
		operation,
		date,
		store,
		exchangeRate,
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
			store ? new StringValueObject(store) : undefined,
			exchangeRate ? new NumberValueObject(exchangeRate) : undefined
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
			store: "",
			exchangeRate: 0,
			updatedAt: new Date().toISOString(),
		};
	}
}

export type TransactionPrimitives = {
	id: string;
	name: string;
	category: string;
	subCategory: string;
	fromSplits?: PaymentSplitPrimitives[];
	toSplits?: PaymentSplitPrimitives[];
	operation: OperationType;
	date: Date;
	store?: string;
	exchangeRate?: number;
	updatedAt: string;
};
