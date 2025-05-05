import { ItemDate } from "./item-date.valueobject";
import { Account, AccountID } from "contexts/Accounts/domain";
import { Entity, ItemOperation } from "contexts/Shared/domain";
import { ItemID, ItemPrice } from "contexts/Items/domain";
import { PriceValueObject } from "@juandardilag/value-objects";

export enum ERecurrenceState {
	PENDING = "pending",
	DELETED = "deleted",
	COMPLETED = "completed",
}

export class ItemRecurrenceModification extends Entity<
	ItemID,
	ItemRecurrenceModificationPrimitives
> {
	constructor(
		id: ItemID,
		private _date: ItemDate,
		private _state: ERecurrenceState,
		private _price?: ItemPrice,
		private _account?: AccountID,
		private _toAccount?: AccountID
	) {
		super(id);
	}

	copy(): ItemRecurrenceModification {
		return new ItemRecurrenceModification(
			this.id,
			this._date,
			this._state,
			this._price,
			this._account,
			this._toAccount
		);
	}

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

	get account(): AccountID | undefined {
		return this._account;
	}

	updateAccount(account: AccountID): void {
		this._account = account;
	}

	get toAccount(): AccountID | undefined {
		return this._toAccount;
	}

	updateToAccount(toAccount: AccountID): void {
		this._toAccount = toAccount;
	}

	getRealPriceForAccount(
		operation: ItemOperation,
		account: Account,
		thisPrice: ItemPrice,
		thisAccount: AccountID,
		thisToAccount?: AccountID
	): PriceValueObject {
		let multiplier = 1;
		if (operation.isTransfer()) {
			if (account.id.equalTo(this._account ?? thisAccount))
				multiplier = -1;
			else if (thisToAccount)
				multiplier = thisToAccount.equalTo(
					this._toAccount ?? thisToAccount
				)
					? 1
					: 0;
		}
		if (operation.isExpense()) multiplier = -multiplier;
		if (account.type.isLiability()) multiplier = -multiplier;
		return new PriceValueObject(
			(this.price?.toNumber() ?? thisPrice.toNumber()) * multiplier
		);
	}

	toPrimitives(): ItemRecurrenceModificationPrimitives {
		return {
			itemID: this.id.value,
			date: this._date,
			state: this._state,
			amount: this._price?.value,
			account: this._account?.value,
			toAccount: this._toAccount?.value,
		};
	}

	static fromPrimitives({
		itemID,
		date,
		amount,
		account,
		toAccount,
		state,
	}: ItemRecurrenceModificationPrimitives): ItemRecurrenceModification {
		return new ItemRecurrenceModification(
			new ItemID(itemID),
			new ItemDate(date),
			state,
			amount ? new ItemPrice(amount) : undefined,
			account ? new AccountID(account) : undefined,
			toAccount ? new AccountID(toAccount) : undefined
		);
	}
}

export type ItemRecurrenceModificationPrimitives = {
	itemID: string;
	date: Date;
	state: ERecurrenceState;
	amount?: number;
	account?: string;
	toAccount?: string;
};
