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
import { SubCategoryID } from "contexts/Subcategories/domain";

const logger = new Logger("RecurrentItem");

export class RecurrentItem extends Item {
	constructor(
		id: ItemID,
		operation: ItemOperation,
		name: ItemName,
		amount: ItemPrice,
		category: CategoryID,
		subCategory: SubCategoryID,
		account: AccountID,
		private _nextDate: RecurrentItemNextDate,
		private _frequency: RecurrrentItemFrequency,
		brand?: ItemBrand | undefined,
		store?: ItemStore | undefined,
		toAccount?: AccountID | undefined //TODO: make required
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

	createRecurretItemsUntilDate(to: RecurrentItemNextDate): RecurrentItem[] {
		const items = [];
		let nextDate = this.nextDate;
		while (nextDate.isLessOrEqualThan(to)) {
			const itemCopy = RecurrentItem.copy(this);
			itemCopy._nextDate = nextDate;
			items.push(itemCopy);
			nextDate.next(this._frequency);
		}
		return items;
	}

	static copy(other: RecurrentItem): RecurrentItem {
		return new RecurrentItem(
			other._id,
			other._operation,
			other._name,
			other._price,
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

	static copyWithNegativeAmount(other: RecurrentItem): RecurrentItem {
		return new RecurrentItem(
			other._id,
			other._operation,
			other._name,
			other._price.negate(),
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

	nextNextDate(): void {
		this.nextDate.next(this.frequency);
	}

	update({
		nextDate,
		...rest
	}: {
		name?: ItemName;
		amount?: ItemPrice;
		category?: CategoryID;
		subCategory?: SubCategoryID;
		account?: AccountID;
		toAccount?: AccountID;
		nextDate?: RecurrentItemNextDate;
	}) {
		super.update(rest);
		if (nextDate) this._nextDate = nextDate;
	}

	updateOnRecord(isPermanent?: {
		amount?: ItemPrice;
		date?: RecurrentItemNextDate;
	}): void {
		let recordDate = isPermanent?.date || this._nextDate;
		const amount = isPermanent?.amount || this._price;
		const prevNextDate = new RecurrentItemNextDate(
			this._nextDate.valueOf()
		);
		this._nextDate.next(this._frequency);
		const nextDate = new RecurrentItemNextDate(this._nextDate.valueOf());

		logger.debug("calculating next date", {
			frequency: this._frequency,
			prev: prevNextDate,
			next: nextDate,
		});

		logger.debug("checking permanent changes", {
			isPermanent,
			amount: {
				change: !!amount,
				from: this._price,
				to: amount,
			},
			recordDate: {
				change: recordDate.compare(prevNextDate) !== 0,
				from: prevNextDate,
				to: recordDate.next(this._frequency),
			},
		});

		if (isPermanent) {
			if (isPermanent.amount) this._price = amount;
			if (isPermanent.date && recordDate.compare(prevNextDate) !== 0)
				recordDate.next(this._frequency);
			this._nextDate = new RecurrentItemNextDate(recordDate.valueOf());
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
			new SubCategoryID(subCategory),
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
