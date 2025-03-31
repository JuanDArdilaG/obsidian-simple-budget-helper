import { ScheduledItemNextDate } from "./scheduled-item-nextdate.valueobject";
import { ScheduledItemFrequency } from "./scheduled-item-frequency.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";
import { Item, ItemPrimitives } from "contexts/SimpleItems/domain/item.entity";
import {
	ItemBrand,
	ItemID,
	ItemName,
	ItemPrice,
	ItemStore,
	SimpleItem,
} from "contexts/SimpleItems/domain";
import { ScheduledItemDate } from "./scheduled-item-date.valueobject";
import { Logger } from "contexts/Shared/infrastructure/logger";
import {
	ScheduledItemRecurrence,
	ScheduledRecurrencePrimitives,
} from "./scheduled-item-recurrence.entity";
import { ScheduledItemRecurrenceModification } from "./scheduled-item-recurrence-modification.valueobject";
import { ItemOperation } from "contexts/Shared/domain";

const logger = new Logger("ScheduledItem");

export class ScheduledItem extends Item {
	constructor(
		id: ItemID,
		operation: ItemOperation,
		name: ItemName,
		price: ItemPrice,
		category: CategoryID,
		subCategory: SubCategoryID,
		account: AccountID,
		private _date: ScheduledItemDate,
		private _recurrence?: ScheduledItemRecurrence,
		brand?: ItemBrand | undefined,
		store?: ItemStore | undefined,
		toAccount?: AccountID | undefined
	) {
		super(
			id,
			operation,
			name,
			price,
			category,
			subCategory,
			account,
			brand,
			store,
			toAccount
		);
	}

	static fromSimpleItem(
		item: SimpleItem,
		date: ScheduledItemDate,
		recurrence?: ScheduledItemRecurrence
	): ScheduledItem {
		return new ScheduledItem(
			ItemID.generate(),
			item.operation,
			item.name,
			item.price,
			item.category,
			item.subCategory,
			item.account,
			date,
			recurrence,
			item.brand,
			item.store,
			item.toAccount
		);
	}

	copy(): ScheduledItem {
		return new ScheduledItem(
			this._id.copy(),
			this._operation.copy(),
			this._name.copy(),
			this._price.copy(),
			this._category.copy(),
			this._subCategory.copy(),
			this._account.copy(),
			this._date.copy(),
			this._recurrence?.copy(),
			this._brand?.copy(),
			this._store?.copy(),
			this._toAccount?.copy()
		);
	}

	get date(): ScheduledItemDate {
		return this._date;
	}

	updateDate(date: ScheduledItemDate) {
		this._date = date;
	}

	calculateNextDate(): ScheduledItemDate {
		if (!this.recurrence?.frequency) return this.date;
		return this.date.next(this.recurrence.frequency);
	}

	updateDateToNextDate() {
		this.updateDate(this.calculateNextDate());
	}

	get recurrence(): ScheduledItemRecurrence | undefined {
		return this._recurrence;
	}

	get totalRecurrences(): number {
		if (!this._recurrence) return 1;
		if (!this._recurrence.untilDate) return -1;
		let nextDate = new ScheduledItemNextDate(
			this._recurrence.startDate.value
		);
		let count = 0;
		while (nextDate.isLessOrEqualThan(this._recurrence.untilDate)) {
			count++;
			nextDate = nextDate.next(this._recurrence.frequency);
		}
		return count;
	}

	createScheduledItemsUntilDate(
		to: ScheduledItemNextDate
	): { item: ScheduledItem; n: NumberValueObject }[] {
		const allRecurrences = this.createAllRecurrences();
		return allRecurrences
			.filter(
				(recurrence) =>
					recurrence.item.date.isGreaterOrEqualThan(this.date) &&
					recurrence.item.date.isLessOrEqualThan(to)
			)
			.map((recurrence) => {
				if (!this.recurrence) return recurrence;
				const modification = this.recurrence.getModification(
					recurrence.n
				);
				if (!modification) return recurrence;
				recurrence.item.applyModification(modification);
				return recurrence;
			});
	}

	applyModification(modification: ScheduledItemRecurrenceModification) {
		const { price, date, account, toAccount } = modification.modifications;

		price && this.updatePrice(price);
		date && this.updateDate(date);
		account && this.updateAccount(account);
		toAccount && this.updateToAccount(toAccount);
	}

	createAllRecurrences(
		max: NumberValueObject = new NumberValueObject(100)
	): { item: ScheduledItem; n: NumberValueObject }[] {
		if (!this._recurrence)
			return [{ item: this, n: NumberValueObject.zero() }];
		const items = [];
		let nextDate = new ScheduledItemNextDate(this._recurrence.startDate);
		let i = 0;
		while (
			i < max.valueOf() &&
			(!this._recurrence.untilDate ||
				nextDate.isLessOrEqualThan(this._recurrence.untilDate))
		) {
			const itemCopy = this.copy();
			itemCopy._date = nextDate.copy();
			items.push({ item: itemCopy, n: new NumberValueObject(i) });
			nextDate = nextDate.next(this._recurrence.frequency);
			i++;
		}
		return items;
	}

	getNScheduledItemRecurrence(n: number): ScheduledItem {
		if (!this._recurrence) return this;
		let item: ScheduledItem = this.copy();
		let count = 0;
		let nextDate = new ScheduledItemNextDate(this._recurrence.startDate);
		while (
			count < n &&
			(!this._recurrence.untilDate ||
				nextDate.isLessOrEqualThan(this._recurrence.untilDate))
		) {
			nextDate = nextDate.next(this._recurrence.frequency);
			count++;
			if (count === n) item._date = new ScheduledItemDate(nextDate);
		}
		return item;
	}

	get pricePerMonth(): ItemPrice {
		if (!this._recurrence?.frequency) return this.realPrice;
		const relation =
			ScheduledItemFrequency.MONTH_DAYS_RELATION /
			this._recurrence.frequency.toNumberOfDays();
		return this.realPrice.times(new NumberValueObject(relation));
	}

	static IsScheduled(item: Item): item is ScheduledItem {
		return item instanceof ScheduledItem;
	}

	updateOnRecord(recordDate: ScheduledItemDate, newAmount?: ItemPrice): void {
		const amount = newAmount ?? this._price;
		if (!this._recurrence?.frequency) return;
		const prevNextDate = new ScheduledItemDate(this._date);
		this.updateDate(this._date.next(this._recurrence.frequency));
		const nextDate = new ScheduledItemDate(this._date);

		logger.debug("calculating next date", {
			frequency: this._recurrence.frequency,
			prev: prevNextDate,
			next: nextDate,
		});

		logger.debug("checking permanent changes", {
			amount: {
				change: !!amount,
				from: this._price,
				to: amount,
			},
			recordDate: {
				change: recordDate.compare(prevNextDate) !== 0,
				from: prevNextDate,
				to: recordDate.next(this._recurrence.frequency),
			},
		});

		this.updateDate(nextDate);
	}

	static emptyPrimitives(): ScheduledItemPrimitives {
		return {
			...super.emptyPrimitives(),
			date: new Date(),
			recurrence: {
				startDate: new Date(),
				frequency: "",
				untilDate: new Date(),
				modifications: [],
			},
		};
	}

	toPrimitives(): ScheduledItemPrimitives {
		return {
			...super.toPrimitives(),
			date: this._date,
			recurrence: this._recurrence?.toPrimitives(),
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
		date,
		recurrence,
		account,
		toAccount,
	}: ScheduledItemPrimitives): ScheduledItem {
		return new ScheduledItem(
			new ItemID(id),
			new ItemOperation(operation),
			new ItemName(name),
			new ItemPrice(amount),
			new CategoryID(category),
			new SubCategoryID(subCategory),
			new AccountID(account),
			new ScheduledItemDate(date),
			recurrence
				? ScheduledItemRecurrence.fromPrimitives(
						new ItemID(id),
						recurrence
				  )
				: undefined,
			brand ? new ItemBrand(brand) : undefined,
			store ? new ItemStore(store) : undefined,
			toAccount ? new AccountID(toAccount) : undefined
		);
	}

	static fromOldPrimitives({
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
		untilDate,
		account,
		toAccount,
	}: OldScheduledItemPrimitives): ScheduledItem {
		return new ScheduledItem(
			new ItemID(id),
			new ItemOperation(operation),
			new ItemName(name),
			new ItemPrice(amount),
			new CategoryID(category),
			new SubCategoryID(subCategory),
			new AccountID(account),
			new ScheduledItemDate(nextDate),
			frequency
				? ScheduledItemRecurrence.fromPrimitives(new ItemID(id), {
						startDate: nextDate,
						frequency,
						untilDate,
				  })
				: undefined,
			brand ? new ItemBrand(brand) : undefined,
			store ? new ItemStore(store) : undefined,
			toAccount ? new AccountID(toAccount) : undefined
		);
	}
}

export type ScheduledItemPrimitives = ItemPrimitives & {
	date: Date;
	recurrence?: ScheduledRecurrencePrimitives;
};

export type OldScheduledItemPrimitives = ItemPrimitives & {
	nextDate: Date;
	frequency?: string;
	untilDate?: Date;
};
