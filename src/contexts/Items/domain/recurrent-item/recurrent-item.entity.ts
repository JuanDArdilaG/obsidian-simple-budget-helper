import { Logger } from "utils/logger";
import { Item, ItemPrimitives } from "../item.entity";
import { RecurrentItemNextDate } from "./recurrent-item-nextdate.valueobject";
import { ItemPrice } from "../item-price.valueobject";
import { RecurrrentItemFrequency } from "./recurrent-item-frequency.valueobject";
import { ItemID } from "../item-id.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemBrand } from "../item-brand.valueobject";
import { ItemCategory } from "../item-category.valueobject";
import { ItemName } from "../item-name.valueobject";
import { ItemOperation } from "../item-operation.valueobject";
import { ItemStore } from "../item-store.valueobject";
import { ItemSubcategory } from "../item-subcategory.valueobject";

export class RecurrentItem extends Item {
	constructor(
		id: ItemID,
		operation: ItemOperation,
		name: ItemName,
		amount: ItemPrice,
		category: ItemCategory,
		subCategory: ItemSubcategory,
		account: AccountID,
		private _nextDate: RecurrentItemNextDate,
		private _frequency: RecurrrentItemFrequency,
		brand?: ItemBrand | undefined,
		store?: ItemStore | undefined,
		toAccount?: AccountID | undefined
	) {
		super(
			id,
			operation,
			name,
			amount,
			category,
			subCategory,
			account,
			brand,
			store,
			toAccount
		);
	}

	get nextDate(): RecurrentItemNextDate {
		return this._nextDate;
	}

	static IsRecurrent(item: Item): item is RecurrentItem {
		return item instanceof RecurrentItem;
	}

	get remainingDays(): { str: string; color: "green" | "yellow" | "red" } {
		const date = new Date(this._nextDate.valueOf().getTime());
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const daysToDate = Math.floor(
			(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);
		const str =
			daysToDate === 1 || daysToDate === -1
				? `${daysToDate} day`
				: `${daysToDate} days`;
		const absRd = Math.abs(daysToDate);
		return {
			str,
			color: daysToDate < -3 ? "red" : absRd <= 3 ? "yellow" : "green",
		};
	}

	updateOnRecord(isPermanent?: {
		amount?: ItemPrice;
		date?: RecurrentItemNextDate;
	}): void {
		let recordDate = isPermanent?.date || this._nextDate;
		const amount = isPermanent?.amount || this._amount;
		const nextDate = this._nextDate.nextDate(this._frequency);

		Logger.debug("calculating next date", {
			frequency: this._frequency,
			prev: this._nextDate,
			next: nextDate,
		});

		Logger.debug("checking permanent changes", {
			isPermanent,
			amount: {
				change: !!amount,
				from: this._amount,
				to: amount,
			},
			recordDate: {
				change: recordDate.compare(this._nextDate) !== 0,
				from: this._nextDate,
				to: recordDate.nextDate(this._frequency),
			},
		});

		if (isPermanent) {
			if (isPermanent.amount) this._amount = amount;
			if (isPermanent.date && recordDate.compare(this._nextDate) !== 0)
				this._nextDate = recordDate.nextDate(this._frequency);
		} else {
			this._nextDate = nextDate;
		}
	}

	toJSON(): RecurrentItemPrimitives {
		return {
			...super.toJSON(),
			nextDate: this._nextDate.valueOf(),
		};
	}
}

export type RecurrentItemPrimitives = ItemPrimitives & { nextDate: Date };
