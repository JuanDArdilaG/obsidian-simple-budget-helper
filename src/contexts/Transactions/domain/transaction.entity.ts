import {
	DateValueObject,
	NumberValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { OperationType } from "contexts/Shared/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";
import { ScheduledTransaction } from "../../ScheduledTransactions/domain";
import { Nanoid } from "../../Shared/domain/value-objects/id/nanoid.valueobject";
import { AccountSplit } from "./account-split.valueobject";
import { TransactionName } from "./item-name.valueobject";
import { TransactionAmount } from "./transaction-amount.valueobject";
import { TransactionDate } from "./transaction-date.valueobject";
import { TransactionOperation } from "./transaction-operation.valueobject";

export class Transaction extends Entity<string, TransactionPrimitives> {
	constructor(
		id: Nanoid,
		private _originAccounts: AccountSplit[],
		private _destinationAccounts: AccountSplit[],
		private _name: TransactionName,
		private _operation: TransactionOperation,
		private _category: Nanoid,
		private _subcategory: Nanoid,
		private _date: TransactionDate,
		updatedAt: DateValueObject,
		private readonly _store?: StringValueObject,
		private _exchangeRate?: NumberValueObject,
	) {
		super(id.value, updatedAt);
		this.validateTransferOperation();
	}

	get nanoid(): Nanoid {
		return new Nanoid(this._id);
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
					"Transfer operations must have a toSplits array",
				);
			}
			if (!this.originAmount.equalTo(this.destinationAmount)) {
				throw new InvalidArgumentError(
					"Transaction",
					`from amount: ${this.originAmount}. to amount: ${this.destinationAmount}`,
					"From amount and to amount should be the same",
				);
			}
		}
	}

	static fromScheduledTransaction(
		scheduledItem: ScheduledTransaction,
		date: TransactionDate,
	): Transaction {
		return new Transaction(
			Nanoid.generate(),
			scheduledItem.originAccounts,
			scheduledItem.destinationAccounts,
			scheduledItem.name,
			scheduledItem.operation.type,
			scheduledItem.category,
			scheduledItem.subcategory,
			date,
			DateValueObject.createNowDate(),
			scheduledItem.store,
		);
	}

	static create(
		date: TransactionDate,
		originAccountSplits: AccountSplit[],
		destinationAccountSplits: AccountSplit[],
		name: TransactionName,
		operation: TransactionOperation,
		category: Nanoid,
		subcategory: Nanoid,
	): Transaction {
		return new Transaction(
			Nanoid.generate(),
			originAccountSplits,
			destinationAccountSplits,
			name,
			operation,
			category,
			subcategory,
			date,
			DateValueObject.createNowDate(),
		);
	}

	get originAccounts(): AccountSplit[] {
		return this._originAccounts;
	}

	get originAmount(): TransactionAmount {
		return AccountSplit.totalAmount(this._originAccounts);
	}

	get realOriginAmount(): TransactionAmount {
		const amount = this.originAmount;
		return this._operation.isExpense()
			? new TransactionAmount(-amount.toNumber())
			: amount;
	}

	get destinationAccounts(): AccountSplit[] {
		return this._destinationAccounts;
	}

	get destinationAmount(): TransactionAmount {
		return AccountSplit.totalAmount(this._destinationAccounts);
	}

	setOriginAccounts(splits: AccountSplit[]): void {
		this._originAccounts = splits;
		this.updateTimestamp();
	}

	setDestinationAccounts(splits: AccountSplit[]): void {
		this._destinationAccounts = splits;
		this.validateTransferOperation();
		this.updateTimestamp();
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

	get category(): Nanoid {
		return this._category;
	}

	updateCategory(category: Nanoid) {
		this._category = category;
		this.updateTimestamp();
	}

	get subcategory(): Nanoid {
		return this._subcategory;
	}

	updateSubCategory(subcategory: Nanoid) {
		this._subcategory = subcategory;
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

	getRealAmountForAccount(accountID: Nanoid): TransactionAmount {
		const originAccounts = this._originAccounts.filter(
			(split) => split.accountId.value === accountID.value,
		);
		const destinationAccounts = this._destinationAccounts.filter(
			(split) => split.accountId.value === accountID.value,
		);

		const originTotal = AccountSplit.totalAmount(originAccounts).toNumber();
		const destinationTotal = AccountSplit.totalAmount(
			destinationAccounts,
			this._exchangeRate,
		).toNumber();

		if (this._operation.isTransfer()) {
			return new TransactionAmount(destinationTotal - originTotal);
		}
		return new TransactionAmount(
			this._operation.isExpense() ? -originTotal : originTotal,
		);
	}

	toPrimitives(): TransactionPrimitives {
		return {
			id: this._id,
			name: this._name.value,
			category: this._category.value,
			subcategory: this._subcategory.value,
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
		fromSplits,
		toSplits,
		operation,
		category,
		subcategory,
		subCategory,
		date,
		store,
		exchangeRate,
		updatedAt,
	}: TransactionPrimitives): Transaction {
		return new Transaction(
			new Nanoid(id),
			fromSplits.map(AccountSplit.fromPrimitives),
			toSplits?.map(AccountSplit.fromPrimitives) || [],
			new TransactionName(name),
			new TransactionOperation(operation),
			new Nanoid(category),
			new Nanoid(subCategory ?? subcategory),
			new TransactionDate(new Date(date)),
			updatedAt
				? new DateValueObject(new Date(updatedAt))
				: DateValueObject.createNowDate(),
			store ? new StringValueObject(store) : undefined,
			exchangeRate ? new NumberValueObject(exchangeRate) : undefined,
		);
	}

	static emptyPrimitives(): TransactionPrimitives {
		return {
			id: "",
			name: "",
			category: "",
			subcategory: "",
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
	subcategory: string;
	subCategory?: string; // Deprecated - kept to maintain backward compatibility
	fromSplits: {
		accountId: string;
		amount: number;
	}[];
	toSplits?: {
		accountId: string;
		amount: number;
	}[];
	operation: OperationType;
	date: Date;
	store?: string;
	exchangeRate?: number;
	updatedAt: string;
};
