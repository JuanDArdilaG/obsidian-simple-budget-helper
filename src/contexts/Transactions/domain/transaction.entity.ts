import {
	DateValueObject,
	NumberValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { Category } from "contexts/Categories/domain";
import { Nanoid, OperationType } from "contexts/Shared/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { InvalidArgumentError } from "contexts/Shared/domain/errors/invalid-argument.error";
import { SubCategory } from "contexts/Subcategories/domain";
import { Account } from "../../Accounts/domain";
import { ScheduledTransaction } from "../../ScheduledTransactions/domain";
import {
	AccountSplit,
	AccountSplitPrimitives,
} from "./account-split.valueobject";
import { TransactionName } from "./item-name.valueobject";
import { TransactionAmount } from "./transaction-amount.valueobject";
import { TransactionDate } from "./transaction-date.valueobject";
import { TransactionOperation } from "./transaction-operation.valueobject";

export class Transaction extends Entity<Nanoid, TransactionPrimitives> {
	constructor(
		id: Nanoid,
		private _originAccounts: AccountSplit[],
		private _destinationAccounts: AccountSplit[],
		private _name: TransactionName,
		private _operation: TransactionOperation,
		private _category: Category,
		private _subcategory: SubCategory,
		private _date: TransactionDate,
		updatedAt: DateValueObject,
		private readonly _store?: StringValueObject,
		private _exchangeRate?: NumberValueObject,
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
			scheduledItem.category.category,
			scheduledItem.category.subCategory,
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
		category: Category,
		subCategory: SubCategory,
	): Transaction {
		return new Transaction(
			Nanoid.generate(),
			originAccountSplits,
			destinationAccountSplits,
			name,
			operation,
			category,
			subCategory,
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

	get category(): Category {
		return this._category;
	}

	updateCategory(category: Category) {
		this._category = category;
		this.updateTimestamp();
	}

	get subcategory(): SubCategory {
		return this._subcategory;
	}

	updateSubCategory(subCategory: SubCategory) {
		this._subcategory = subCategory;
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
		const originAccounts = this._originAccounts.filter((split) =>
			split.account.id.equalTo(accountID),
		);
		const destinationAccounts = this._destinationAccounts.filter((split) =>
			split.account.id.equalTo(accountID),
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
			id: this._id.value,
			name: this._name.value,
			category: this._category.id.value,
			subCategory: this._subcategory.id.value,
			fromSplits: this._originAccounts.map((s) => s.toPrimitives()),
			toSplits: this._destinationAccounts.map((s) => s.toPrimitives()),
			operation: this._operation.value,
			date: this._date,
			updatedAt: this._updatedAt.toISOString(),
			store: this._store?.value,
			exchangeRate: this._exchangeRate?.value,
		};
	}

	static fromPrimitives(
		accountsMap: Map<string, Account>,
		category: Category,
		subCategory: SubCategory,
		{
			id,
			name,
			fromSplits,
			toSplits,
			operation,
			date,
			store,
			exchangeRate,
			updatedAt,
		}: TransactionPrimitives,
	): Transaction {
		const _fromSplits: AccountSplit[] =
			fromSplits?.map((primitive) =>
				AccountSplit.fromPrimitives(
					accountsMap.get(primitive.accountId)!,
					primitive,
				),
			) || [];
		const _toSplits: AccountSplit[] =
			toSplits?.map((primitive) =>
				AccountSplit.fromPrimitives(
					accountsMap.get(primitive.accountId)!,
					primitive,
				),
			) || [];
		return new Transaction(
			new Nanoid(id),
			_fromSplits,
			_toSplits,
			new TransactionName(name),
			new TransactionOperation(operation),
			category,
			subCategory,
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
	fromSplits?: AccountSplitPrimitives[];
	toSplits?: AccountSplitPrimitives[];
	operation: OperationType;
	date: Date;
	store?: string;
	exchangeRate?: number;
	updatedAt: string;
};
