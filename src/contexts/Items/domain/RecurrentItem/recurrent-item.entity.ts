import { Logger } from "../../../Shared/infrastructure/logger";
import { Item, ItemPrimitives } from "../item.entity";
import { RecurrentItemNextDate } from "./recurrent-item-nextdate.valueobject";
import { ItemPrice } from "../item-price.valueobject";
import { RecurrrentItemFrequency } from "./recurrent-item-frequency.valueobject";
import { ItemID } from "../item-id.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemBrand } from "../item-brand.valueobject";
import { ItemName } from "../item-name.valueobject";
import { ItemOperation } from "../item-operation.valueobject";
import { ItemStore } from "../item-store.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { SubcategoryID } from "contexts/Subcategories/domain";

export class RecurrentItem extends Item {
	constructor(
		id: ItemID,
		operation: ItemOperation,
		name: ItemName,
		amount: ItemPrice,
		category: CategoryID,
		subCategory: SubcategoryID,
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

	createRecurretItemsBetweenDates(
		from: RecurrentItemNextDate,
		to: RecurrentItemNextDate
	): RecurrentItem[] {
		const items = [];
		let nextDate = this.nextDate;
		while (from.isLessOrEqualThan(to)) {
			const itemCopy = RecurrentItem.copy(this);
			itemCopy._nextDate = nextDate;
			items.push(itemCopy);
			nextDate = nextDate.next(this._frequency);
			from = nextDate;
		}
		return items;
	}

	static copy(other: RecurrentItem): RecurrentItem {
		return new RecurrentItem(
			other._id,
			other._operation,
			other._name,
			other._amount,
			other._category,
			other._subCategory,
			other._account,
			other._nextDate,
			other._frequency,
			other._brand,
			other._store,
			other._toAccount
		);
	}

	get nextDate(): RecurrentItemNextDate {
		return this._nextDate;
	}

	set nextDate(nextDate: RecurrentItemNextDate) {
		this._nextDate = nextDate;
	}

	get frequency(): RecurrrentItemFrequency {
		return this._frequency;
	}

	static IsRecurrent(item: Item): item is RecurrentItem {
		return item instanceof RecurrentItem;
	}

	get remainingDays(): { str: string; color: "green" | "yellow" | "red" } {
		const daysToDate = this.nextDate.getRemainingDays();
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
		const nextDate = this._nextDate.next(this._frequency);

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
				to: recordDate.next(this._frequency),
			},
		});

		if (isPermanent) {
			if (isPermanent.amount) this._amount = amount;
			if (isPermanent.date && recordDate.compare(this._nextDate) !== 0)
				this._nextDate = recordDate.next(this._frequency);
		} else {
			this._nextDate = nextDate;
		}
	}

	toPrimitives(): RecurrentItemPrimitives {
		return {
			...super.toPrimitives(),
			nextDate: this._nextDate.valueOf(),
			frequency: this._frequency.value,
		};
	}

	static fromPrimitives({
		id,
		operation,
		name,
		amount,
		category,
		subCategory,
		brand,
		store,
		nextDate,
		frequency,
		account,
		toAccount,
	}: RecurrentItemPrimitives): RecurrentItem {
		return new RecurrentItem(
			new ItemID(id),
			new ItemOperation(operation),
			new ItemName(name),
			new ItemPrice(amount),
			new CategoryID(category),
			new SubcategoryID(subCategory),
			new AccountID(account),
			new RecurrentItemNextDate(nextDate),
			new RecurrrentItemFrequency(frequency),
			brand ? new ItemBrand(brand) : undefined,
			store ? new ItemStore(store) : undefined,
			toAccount ? new AccountID(toAccount) : undefined
		);
	}
}

export type RecurrentItemPrimitives = ItemPrimitives & {
	nextDate: Date;
	frequency: string;
};
