import { PriceValueObject } from "@juandardilag/value-objects";
import { Account } from "contexts/Accounts/domain";
import { ItemOperation } from "contexts/Shared/domain";
import {
	PaymentSplit,
	PaymentSplitPrimitives,
	TransactionAmount,
} from "../../Transactions/domain";
import { ItemBrand } from "./item-brand.valueobject";
import { ItemDate } from "./item-date.valueobject";
import { ItemStore } from "./item-store.valueobject";

export enum ERecurrenceState {
	PENDING = "pending",
	DELETED = "deleted",
	COMPLETED = "completed",
}

export class ItemRecurrenceInfo {
	constructor(
		private _date: ItemDate,
		private _state: ERecurrenceState,
		private _fromSplits?: PaymentSplit[],
		private _toSplits?: PaymentSplit[],
		private _brand?: ItemBrand,
		private _store?: ItemStore
	) {}

	get date(): ItemDate {
		return this._date;
	}

	updateDate(date: ItemDate): void {
		this._date = date;
	}

	get state(): ERecurrenceState {
		return this._state;
	}

	updateState(state: ERecurrenceState): void {
		this._state = state;
	}

	get fromSplits(): PaymentSplit[] | undefined {
		return this._fromSplits;
	}

	updateFromSplits(fromSplits: PaymentSplit[]): void {
		this._fromSplits = fromSplits;
	}

	get fromAmount(): TransactionAmount | undefined {
		return this._fromSplits?.reduce(
			(sum, split) => split.amount.plus(sum),
			TransactionAmount.zero()
		);
	}

	get toAmount(): TransactionAmount | undefined {
		return this._toSplits?.reduce(
			(sum, split) => split.amount.plus(sum),
			TransactionAmount.zero()
		);
	}

	get toSplits(): PaymentSplit[] | undefined {
		return this._toSplits;
	}

	updateToSplits(toSplits: PaymentSplit[]): void {
		this._toSplits = toSplits;
	}

	get brand(): ItemBrand | undefined {
		return this._brand;
	}

	updateBrand(brand: ItemBrand | undefined): void {
		this._brand = brand;
	}

	get store(): ItemStore | undefined {
		return this._store;
	}

	updateStore(store: ItemStore | undefined): void {
		this._store = store;
	}

	getRealPriceForAccount(
		operation: ItemOperation,
		account: Account,
		itemFromSplits: PaymentSplit[],
		itemToSplits?: PaymentSplit[]
	): PriceValueObject {
		let multiplier = 1;
		const amount = (this._fromSplits ?? itemFromSplits).reduce(
			(sum, split) => sum + split.amount.value,
			0
		);

		if (operation.type.isTransfer()) {
			// Check if account is in fromSplits (negative multiplier)
			const fromSplit = (this._fromSplits ?? itemFromSplits).find(
				(split) => split.accountId.equalTo(account.id)
			);
			if (fromSplit) {
				multiplier = -1;
			} else {
				// Check if account is in toSplits (positive multiplier)
				const toSplit = (this._toSplits ?? itemToSplits)?.find(
					(split) => split.accountId.equalTo(account.id)
				);
				if (toSplit) {
					multiplier = 1;
				} else {
					multiplier = 0; // Account not involved in this recurrence
				}
			}
		}
		if (operation.type.isExpense()) multiplier = -multiplier;
		if (account.type.isLiability()) multiplier = -multiplier;
		return new PriceValueObject(amount * multiplier);
	}

	toPrimitives(): ItemRecurrenceInfoPrimitives {
		return {
			date: this._date,
			state: this._state,
			fromSplits: this._fromSplits?.map((split) => split.toPrimitives()),
			toSplits: this._toSplits?.map((split) => split.toPrimitives()),
			brand: this._brand?.value,
			store: this._store?.value,
		};
	}

	static fromPrimitives({
		date,
		fromSplits,
		toSplits,
		state,
		brand,
		store,
	}: ItemRecurrenceInfoPrimitives): ItemRecurrenceInfo {
		return new ItemRecurrenceInfo(
			new ItemDate(new Date(date)),
			state,
			fromSplits?.map((split) => PaymentSplit.fromPrimitives(split)),
			toSplits?.map((split) => PaymentSplit.fromPrimitives(split)),
			brand ? new ItemBrand(brand) : undefined,
			store ? new ItemStore(store) : undefined
		);
	}
}

export type ItemRecurrenceInfoPrimitives = {
	date: Date;
	state: ERecurrenceState;
	fromSplits?: PaymentSplitPrimitives[];
	toSplits?: PaymentSplitPrimitives[];
	brand?: string;
	store?: string;
};
