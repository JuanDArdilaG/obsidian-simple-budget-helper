import { NumberValueObject } from "@juandardilag/value-objects";
import { ItemDate } from "./item-date.valueobject";
import { AccountID } from "contexts/Accounts/domain";
import { Entity } from "contexts/Shared/domain";
import { ItemID, ItemPrice } from "contexts/Items/domain";

export type RecurrenceModifications = {
	date?: ItemDate;
	price?: ItemPrice;
	account?: AccountID;
	toAccount?: AccountID;
};

export class ItemRecurrenceModification extends Entity<
	ItemID,
	ItemRecurrenceModificationPrimitives
> {
	constructor(
		id: ItemID,
		private readonly _n: NumberValueObject,
		private readonly _modifications: RecurrenceModifications
	) {
		super(id);
	}

	copy(): ItemRecurrenceModification {
		return new ItemRecurrenceModification(this.id, this._n, {
			...this._modifications,
		});
	}

	get n(): NumberValueObject {
		return this._n;
	}

	get modifications(): RecurrenceModifications {
		return this._modifications;
	}

	toPrimitives(): ItemRecurrenceModificationPrimitives {
		return {
			n: this._n.value,
			date: this._modifications.date,
			amount: this._modifications.price?.value,
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
		}: ItemRecurrenceModificationPrimitives
	): ItemRecurrenceModification {
		return new ItemRecurrenceModification(
			itemID,
			new NumberValueObject(n),
			{
				date: date ? new ItemDate(date) : undefined,
				price: amount ? new ItemPrice(amount) : undefined,
				account: account ? new AccountID(account) : undefined,
				toAccount: toAccount ? new AccountID(toAccount) : undefined,
			}
		);
	}
}

export type ItemRecurrenceModificationPrimitives = {
	n: number;
	date?: Date;
	amount?: number;
	account?: string;
	toAccount?: string;
};
