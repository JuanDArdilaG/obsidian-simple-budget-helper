import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";
import { ScheduledItemDate } from "./scheduled-item-date.valueobject";
import { AccountID } from "contexts/Accounts/domain";
import { Entity } from "contexts/Shared/domain";
import { ItemID, ItemPrice } from "contexts/SimpleItems/domain";

export type RecurrenceModifications = {
	date?: ScheduledItemDate;
	price?: ItemPrice;
	account?: AccountID;
	toAccount?: AccountID;
};

export class ScheduledItemRecurrenceModification extends Entity<
	ItemID,
	ScheduledItemRecurrenceModificationPrimitives
> {
	constructor(
		id: ItemID,
		private _n: NumberValueObject,
		private _modifications: RecurrenceModifications
	) {
		super(id);
	}

	copy(): ScheduledItemRecurrenceModification {
		return new ScheduledItemRecurrenceModification(
			this.id.copy(),
			this._n.copy(),
			{ ...this._modifications }
		);
	}

	get n(): NumberValueObject {
		return this._n;
	}

	get modifications(): RecurrenceModifications {
		return this._modifications;
	}

	toPrimitives(): ScheduledItemRecurrenceModificationPrimitives {
		return {
			n: this._n.valueOf(),
			date: this._modifications.date,
			amount: this._modifications.price?.valueOf(),
			account: this._modifications.account?.value,
			toAccount: this._modifications.toAccount?.value,
		};
	}

	static fromPrimitives(
		itemID: ItemID,
		{
			n,
			date,
			amount,
			account,
			toAccount,
		}: ScheduledItemRecurrenceModificationPrimitives
	): ScheduledItemRecurrenceModification {
		return new ScheduledItemRecurrenceModification(
			itemID,
			new NumberValueObject(n),
			{
				date: date ? new ScheduledItemDate(date) : undefined,
				price: amount ? new ItemPrice(amount) : undefined,
				account: account ? new AccountID(account) : undefined,
				toAccount: toAccount ? new AccountID(toAccount) : undefined,
			}
		);
	}
}

export type ScheduledItemRecurrenceModificationPrimitives = {
	n: number;
	date?: Date;
	amount?: number;
	account?: string;
	toAccount?: string;
};
