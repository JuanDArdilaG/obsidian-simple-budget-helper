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
import { TransactionAmount } from "./transaction-amount.valueobject";
import { TransactionDate } from "./transaction-date.valueobject";
import {
	TransactionItem,
	TransactionItemPrimitives,
} from "./transaction-item.entity";
import { TransactionOperation } from "./transaction-operation.valueobject";

export class Transaction extends Entity<string, TransactionPrimitives> {
	constructor(
		id: Nanoid,
		private _originAccounts: AccountSplit[],
		private _destinationAccounts: AccountSplit[],
		private _operation: TransactionOperation,
		private _date: TransactionDate,
		private readonly _items: TransactionItem[],
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
					`from amount: ${this.originAmount.value}. to amount: ${this.destinationAmount.value}`,
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
			scheduledItem.operation.type,
			date,
			[
				new TransactionItem(
					scheduledItem.name,
					scheduledItem.originAmount,
					1,
					scheduledItem.category,
					scheduledItem.subcategory,
				),
			],
			DateValueObject.createNowDate(),
			scheduledItem.store,
		);
	}

	static create(
		date: TransactionDate,
		originAccountSplits: AccountSplit[],
		destinationAccountSplits: AccountSplit[],
		operation: TransactionOperation,
		items: TransactionItem[],
	): Transaction {
		return new Transaction(
			Nanoid.generate(),
			originAccountSplits,
			destinationAccountSplits,
			operation,
			date,
			items,
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

	get items(): TransactionItem[] {
		return this._items;
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
			fromSplits: this._originAccounts.map((s) => s.toPrimitives()),
			toSplits: this._destinationAccounts.map((s) => s.toPrimitives()),
			operation: this._operation.value,
			date: this._date,
			items: this._items.map((item) => item.toPrimitives()),
			updatedAt: this._updatedAt.toISOString(),
			store: this._store?.value,
			exchangeRate: this._exchangeRate?.value,
		};
	}

	static fromPrimitives({
		id,
		fromSplits,
		toSplits,
		operation,
		date,
		items,
		store,
		exchangeRate,
		updatedAt,
	}: TransactionPrimitives): Transaction {
		return new Transaction(
			new Nanoid(id),
			fromSplits.map(AccountSplit.fromPrimitives),
			toSplits?.map(AccountSplit.fromPrimitives) || [],
			new TransactionOperation(operation),
			new TransactionDate(new Date(date)),
			items.map(TransactionItem.fromPrimitives),
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
			fromSplits: [],
			toSplits: [],
			operation: "expense",
			date: new Date(),
			items: [],
			store: "",
			exchangeRate: 0,
			updatedAt: new Date().toISOString(),
		};
	}
}

export type TransactionPrimitives = {
	id: string;
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
	items: TransactionItemPrimitives[];
	store?: string;
	exchangeRate?: number;
	updatedAt: string;
};
