import { PriceValueObject } from "@juandardilag/value-objects";
import { Account, AccountID } from "contexts/Accounts/domain";
import { ItemPrice } from "contexts/Items/domain";
import { ItemOperation } from "contexts/Shared/domain";
import {
	PaymentSplit,
	PaymentSplitPrimitives,
} from "../../Transactions/domain";
import { ItemDate } from "./item-date.valueobject";

export enum ERecurrenceState {
	PENDING = "pending",
	DELETED = "deleted",
	COMPLETED = "completed",
}

export class ItemRecurrenceInfo {
	constructor(
		private _date: ItemDate,
		private _state: ERecurrenceState,
		private _price?: ItemPrice,
		private _fromSplits?: PaymentSplit[],
		private _toSplits?: PaymentSplit[]
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

	get price(): ItemPrice | undefined {
		return this._price;
	}

	updatePrice(price: ItemPrice): void {
		this._price = price;
	}

	get fromSplits(): PaymentSplit[] | undefined {
		return this._fromSplits;
	}

	updateFromSplits(fromSplits: PaymentSplit[]): void {
		this._fromSplits = fromSplits;
	}

	get toSplits(): PaymentSplit[] | undefined {
		return this._toSplits;
	}

	updateToSplits(toSplits: PaymentSplit[]): void {
		this._toSplits = toSplits;
	}

	getRealPriceForAccount(
		operation: ItemOperation,
		account: Account,
		thisPrice: ItemPrice,
		thisAccount: AccountID,
		thisToAccount?: AccountID
	): PriceValueObject {
		let multiplier = 1;
		let amount = 0;
		if (this._fromSplits && this._fromSplits.length > 0) {
			// Use the sum of recurrence.fromSplits
			amount = this._fromSplits.reduce(
				(sum, split) => sum + split.amount.value,
				0
			);
		} else {
			// Fallback to the main item's fromAmount
			amount = thisPrice.toNumber();
		}
		if (operation.type.isTransfer()) {
			// Check if account is in fromSplits (negative multiplier)
			const fromSplit = this._fromSplits?.find((split) =>
				split.accountId.equalTo(account.id)
			);
			if (fromSplit) {
				multiplier = -1;
			} else {
				// Check if account is in toSplits (positive multiplier)
				const toSplit = this._toSplits?.find((split) =>
					split.accountId.equalTo(account.id)
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
			amount: this._price?.value,
			fromSplits: this._fromSplits?.map((split) => split.toPrimitives()),
			toSplits: this._toSplits?.map((split) => split.toPrimitives()),
		};
	}

	static fromPrimitives({
		date,
		amount,
		fromSplits,
		toSplits,
		state,
	}: ItemRecurrenceInfoPrimitives): ItemRecurrenceInfo {
		return new ItemRecurrenceInfo(
			new ItemDate(new Date(date)),
			state,
			amount ? new ItemPrice(amount) : undefined,
			fromSplits?.map((split) => PaymentSplit.fromPrimitives(split)),
			toSplits?.map((split) => PaymentSplit.fromPrimitives(split))
		);
	}
}

export type ItemRecurrenceInfoPrimitives = {
	date: Date;
	state: ERecurrenceState;
	amount?: number;
	fromSplits?: PaymentSplitPrimitives[];
	toSplits?: PaymentSplitPrimitives[];
};
