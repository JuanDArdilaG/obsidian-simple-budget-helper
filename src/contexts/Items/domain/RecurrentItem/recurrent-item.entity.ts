import { Logger } from "../../../Shared/infrastructure/logger";
import { RecurrentItemNextDate } from "./recurrent-item-nextdate.valueobject";
import { RecurrrentItemFrequency } from "./recurrent-item-frequency.valueobject";
import { RecurrentItemUntilDate } from "./recurrent-item-untildate.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { NumberValueObject } from "@juandardilag/value-objects/NumberValueObject";
import { Item, ItemPrimitives } from "contexts/Items/domain/item.entity";
import { ItemID } from "../item-id.valueobject";
import { ItemOperation } from "../item-operation.valueobject";
import { ItemBrand } from "../item-brand.valueobject";
import { ItemName } from "../item-name.valueobject";
import { ItemPrice } from "../item-price.valueobject";
import { ItemStore } from "../item-store.valueobject";
import { SimpleItem } from "contexts/Items";

const logger = new Logger("RecurrentItem");

export class RecurrentItem extends Item {
	constructor(
		id: ItemID,
		operation: ItemOperation,
		name: ItemName,
		price: ItemPrice,
		category: CategoryID,
		subCategory: SubCategoryID,
		account: AccountID,
		private _nextDate: RecurrentItemNextDate,
		private _frequency?: RecurrrentItemFrequency,
		private _untilDate?: RecurrentItemUntilDate,
		brand?: ItemBrand | undefined,
		store?: ItemStore | undefined,
		toAccount?: AccountID | undefined //TODO: make required
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
		nextDate: RecurrentItemNextDate,
		frequency?: RecurrrentItemFrequency,
		untilDate?: RecurrentItemUntilDate
	): RecurrentItem {
		return new RecurrentItem(
			ItemID.generate(),
			item.operation,
			item.name,
			item.price,
			item.category,
			item.subCategory,
			item.account,
			nextDate,
			frequency,
			untilDate,
			item.brand,
			item.store,
			item.toAccount
		);
	}

	createRecurretItemsUntilDate(to: RecurrentItemNextDate): RecurrentItem[] {
		if (!this._frequency) return [this];
		const items = [];
		let nextDate = this.nextDate.copy();
		while (
			nextDate.isLessOrEqualThan(to) &&
			(!this._untilDate || nextDate.isLessOrEqualThan(this._untilDate))
		) {
			const itemCopy = this.copy();
			itemCopy._nextDate = nextDate.copy();
			items.push(itemCopy);
			nextDate.next(this._frequency);
		}
		return items;
	}

	copy(): RecurrentItem {
		return new RecurrentItem(
			this._id,
			this._operation,
			this._name,
			this._price,
			this._category,
			this._subCategory,
			this._account,
			this._nextDate,
			this._frequency,
			this._untilDate,
			this._brand,
			this._store,
			this._toAccount
		);
	}

	copyWithNegativeAmount(): RecurrentItem {
		return new RecurrentItem(
			this._id,
			this._operation,
			this._name,
			this._price.negate(),
			this._category,
			this._subCategory,
			this._account,
			this._nextDate,
			this._frequency,
			this._untilDate,
			this._brand,
			this._store,
			this._toAccount
		);
	}

	get nextDate(): RecurrentItemNextDate {
		return this._nextDate;
	}

	get pricePerMonth(): ItemPrice {
		if (!this._frequency) return ItemPrice.zero();
		const relation =
			RecurrrentItemFrequency.MONTH_DAYS_RELATION /
			this._frequency.toNumberOfDays();
		return this.realPrice.times(new NumberValueObject(relation));
	}

	set nextDate(nextDate: RecurrentItemNextDate) {
		this._nextDate = nextDate;
	}

	get frequency(): RecurrrentItemFrequency | undefined {
		return this._frequency;
	}

	get untilDate(): RecurrentItemUntilDate | undefined {
		return this._untilDate;
	}

	updateUntilDate(untilDate?: RecurrentItemNextDate): void {
		this._untilDate = untilDate;
	}

	static IsRecurrent(item: Item): item is RecurrentItem {
		return item instanceof RecurrentItem;
	}

	nextNextDate(): void {
		if (!this._frequency) return;
		this.nextDate.next(this._frequency);
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
		let recordDate = isPermanent?.date ?? this._nextDate;
		const amount = isPermanent?.amount ?? this._price;
		if (this._frequency) {
			const prevNextDate = new RecurrentItemNextDate(
				this._nextDate.valueOf()
			);
			this._nextDate.next(this._frequency);
			const nextDate = new RecurrentItemNextDate(
				this._nextDate.valueOf()
			);

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
				this._nextDate = new RecurrentItemNextDate(
					recordDate.valueOf()
				);
			} else {
				this._nextDate = nextDate;
			}
		}
	}

	static emptyPrimitives(): RecurrentItemPrimitives {
		return {
			...super.emptyPrimitives(),
			nextDate: new Date(),
			frequency: "",
			untilDate: undefined,
		};
	}

	toPrimitives(): RecurrentItemPrimitives {
		return {
			...super.toPrimitives(),
			nextDate: this._nextDate.valueOf(),
			frequency: this._frequency?.value,
			untilDate: this._untilDate?.valueOf(),
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
		untilDate,
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
			frequency ? new RecurrrentItemFrequency(frequency) : undefined,
			untilDate ? new RecurrentItemUntilDate(untilDate) : undefined,
			brand ? new ItemBrand(brand) : undefined,
			store ? new ItemStore(store) : undefined,
			toAccount ? new AccountID(toAccount) : undefined
		);
	}
}

export type RecurrentItemPrimitives = ItemPrimitives & {
	nextDate: Date;
	frequency?: string;
	untilDate?: Date;
};
