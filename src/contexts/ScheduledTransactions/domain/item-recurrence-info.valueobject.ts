import {
	PriceValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { ItemOperation, Nanoid } from "contexts/Shared/domain";
import { Account } from "../../Accounts/domain";
import { AccountSplit, TransactionAmount } from "../../Transactions/domain";
import { ItemTags } from "./item-tags.valueobject";
import {
	RecurrenceModification,
	RecurrenceState,
} from "./recurrence-modification.entity";
import { ScheduledTransactionDate } from "./scheduled-transaction-date.vo";
import { ScheduledTransaction } from "./scheduled-transaction.entity";

export class ItemRecurrenceInfo {
	constructor(
		private readonly _scheduledTransactionId: Nanoid,
		private readonly _occurrenceIndex: number,
		private readonly _name: StringValueObject,
		private _date: ScheduledTransactionDate,
		private readonly _operation: ItemOperation,
		private readonly _category: Nanoid,
		private readonly _subcategory: Nanoid,
		private _state: RecurrenceState,
		private _originAccounts: AccountSplit[],
		private _destinationAccounts: AccountSplit[],
		private _store?: StringValueObject,
		private readonly _tags?: ItemTags,
	) {}

	static fromScheduledTransaction(
		scheduledTransaction: ScheduledTransaction,
		occurrenceIndex: number,
		date: ScheduledTransactionDate,
	) {
		return new ItemRecurrenceInfo(
			scheduledTransaction.nanoid,
			occurrenceIndex,
			scheduledTransaction.name,
			date,
			scheduledTransaction.operation,
			scheduledTransaction.category,
			scheduledTransaction.subcategory,
			RecurrenceState.PENDING,
			scheduledTransaction.originAccounts,
			scheduledTransaction.destinationAccounts,
			scheduledTransaction.store,
			scheduledTransaction.tags,
		);
	}

	static fromModification(
		scheduledTransaction: ScheduledTransaction,
		modification: RecurrenceModification,
	) {
		return new ItemRecurrenceInfo(
			scheduledTransaction.nanoid,
			modification.index,
			scheduledTransaction.name,
			new ScheduledTransactionDate(
				modification.date ?? modification.originalDate,
			),
			scheduledTransaction.operation,
			scheduledTransaction.category,
			scheduledTransaction.subcategory,
			modification.state,
			modification.fromSplits ?? scheduledTransaction.originAccounts,
			modification.toSplits ?? scheduledTransaction.destinationAccounts,
			scheduledTransaction.store,
			scheduledTransaction.tags,
		);
	}

	get scheduledTransactionId(): Nanoid {
		return this._scheduledTransactionId;
	}

	get occurrenceIndex(): number {
		return this._occurrenceIndex;
	}

	get name(): StringValueObject {
		return this._name;
	}

	get operation(): ItemOperation {
		return this._operation;
	}

	get category(): Nanoid {
		return this._category;
	}

	get subcategory(): Nanoid {
		return this._subcategory;
	}

	get date(): ScheduledTransactionDate {
		return this._date;
	}

	updateDate(date: ScheduledTransactionDate): void {
		this._date = date;
	}

	get state(): RecurrenceState {
		return this._state;
	}

	updateState(state: RecurrenceState): void {
		this._state = state;
	}

	get originAccounts(): AccountSplit[] {
		return this._originAccounts;
	}

	updateFromSplits(fromSplits: AccountSplit[]): void {
		this._originAccounts = fromSplits;
	}

	get originAmount(): TransactionAmount {
		return this._originAccounts.reduce(
			(sum, split) => split.amount.plus(sum),
			TransactionAmount.zero(),
		);
	}

	get realOriginAmount(): PriceValueObject {
		const amount = this.originAmount;
		if (this.operation.type.isExpense()) {
			return new PriceValueObject(-amount.value);
		}
		return new PriceValueObject(amount.value);
	}

	get destinationAmount(): TransactionAmount {
		return this._destinationAccounts.reduce(
			(sum, split) => split.amount.plus(sum),
			TransactionAmount.zero(),
		);
	}

	get destinationAccounts(): AccountSplit[] {
		return this._destinationAccounts;
	}

	updateToSplits(toSplits: AccountSplit[]): void {
		this._destinationAccounts = toSplits;
	}

	get store(): StringValueObject | undefined {
		return this._store;
	}

	updateStore(store: StringValueObject | undefined): void {
		this._store = store;
	}

	get tags(): ItemTags | undefined {
		return this._tags;
	}

	getRealPriceForAccount(
		operation: ItemOperation,
		account: Account,
		itemFromSplits: AccountSplit[],
		itemToSplits?: AccountSplit[],
	): PriceValueObject {
		let multiplier = 1;
		const amount = (this._originAccounts ?? itemFromSplits).reduce(
			(sum, split) => sum + split.amount.value,
			0,
		);

		if (operation.type.isTransfer()) {
			// Check if account is in fromSplits (negative multiplier)
			const fromSplit = (this._originAccounts ?? itemFromSplits).find(
				(split) => split.accountId.equalTo(account.nanoid),
			);
			if (fromSplit) {
				multiplier = -1;
			} else {
				// Check if account is in toSplits (positive multiplier)
				const toSplit = (
					this._destinationAccounts ?? itemToSplits
				)?.find((split) => split.accountId.equalTo(account.nanoid));
				if (!toSplit) {
					multiplier = 0;
				}
			}
		}
		if (operation.type.isExpense()) multiplier = -multiplier;
		if (account.type.isLiability()) multiplier = -multiplier;
		return new TransactionAmount(amount * multiplier);
	}
}
