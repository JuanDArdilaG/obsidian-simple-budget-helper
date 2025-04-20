import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import { ItemOperation } from "../../Shared/domain/Item/item-operation.valueobject";
import { OperationType } from "contexts/Shared/domain/value-objects/operation.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import {
	DateValueObject,
	PriceValueObject,
	NumberValueObject,
} from "@juandardilag/value-objects";
import { Account } from "contexts/Accounts/domain";
import { ItemProductInfo } from "./item-product-info.valueobject";
import { ItemDate } from "./item-date.valueobject";
import { ItemRecurrence, RecurrencePrimitives } from "./item-recurrence.entity";
import { ItemRecurrenceModification } from "./item-recurrence-modification.valueobject";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ItemBrand } from "./item-brand.valueobject";
import { ItemStore } from "./item-store.valueobject";

export class Item extends Entity<ItemID, ItemPrimitives> {
	readonly #logger = new Logger("Item");
	constructor(
		id: ItemID,
		private _operation: ItemOperation,
		private _name: ItemName,
		private _price: ItemPrice,
		private _category: CategoryID,
		private _subCategory: SubCategoryID,
		private _account: AccountID,
		private _date: ItemDate,
		private _toAccount?: AccountID,
		private _recurrence?: ItemRecurrence,
		private readonly _info?: ItemProductInfo
	) {
		super(id);
	}

	copy(): Item {
		return new Item(
			this._id,
			this._operation,
			this._name,
			this._price,
			this._category,
			this._subCategory,
			this._account,
			this._date,
			this._toAccount,
			this._recurrence,
			this._info
		);
	}

	copyWithNegativeAmount(): Item {
		return new Item(
			this._id,
			this._operation,
			this._name,
			this._price.negate(),
			this._category,
			this._subCategory,
			this._account,
			this._date,
			this._toAccount,
			this._recurrence,
			this._info
		);
	}

	get id(): ItemID {
		return this._id;
	}

	get operation(): ItemOperation {
		return this._operation;
	}

	updateOperation(operation: ItemOperation): void {
		this._operation = operation;
	}

	get name(): ItemName {
		return this._name;
	}

	updateName(name: ItemName): void {
		this._name = name;
	}

	get price(): ItemPrice {
		return this._price;
	}

	updatePrice(price: ItemPrice) {
		this._price = price;
	}

	get realPrice(): ItemPrice {
		if (this._operation.isIncome()) return this._price;
		else if (this._operation.isExpense()) return this._price.negate();
		return ItemPrice.zero();
	}

	get pricePerMonth(): ItemPrice {
		if (!this._recurrence?.frequency) return this.realPrice;
		return this.realPrice.times(this._recurrence.perMonthRelation);
	}

	getRealPriceForAccount(account: Account): PriceValueObject {
		let multiplier = 1;
		if (this.operation.isTransfer()) {
			if (account.id.equalTo(this._account)) multiplier = -1;
			else if (this._toAccount)
				multiplier = this._toAccount.equalTo(this._toAccount) ? 1 : 0;
		}
		if (this.operation.isExpense()) multiplier = -multiplier;
		if (account.type.isLiability()) multiplier = -multiplier;
		return new PriceValueObject(this._price.toNumber() * multiplier);
	}

	set price(amount: ItemPrice) {
		this._price = amount;
	}

	get category(): CategoryID {
		return this._category;
	}

	updateCategory(category: CategoryID): void {
		this._category = category;
	}

	get subCategory(): SubCategoryID {
		return this._subCategory;
	}

	updateSubCategory(subCategory: SubCategoryID): void {
		this._subCategory = subCategory;
	}

	get info(): ItemProductInfo | undefined {
		return this._info;
	}

	get account(): AccountID {
		return this._account;
	}

	updateAccount(account: AccountID) {
		this._account = account;
	}

	get toAccount(): AccountID | undefined {
		return this._toAccount;
	}

	updateToAccount(toAccount: AccountID | undefined) {
		this._toAccount = toAccount;
	}

	get date(): ItemDate {
		return this._date;
	}

	updateDate(date: ItemDate) {
		this._date = date;
	}

	advanceDateToNextDate() {
		if (!this._recurrence) return;
		this.updateDate(this._recurrence.calculateNextDate(this._date));
	}

	get recurrence(): ItemRecurrence | undefined {
		return this._recurrence;
	}

	updateRecurrence(recurrence: ItemRecurrence | undefined) {
		this._recurrence = recurrence;
	}

	createItemsUntilDate(
		to: DateValueObject
	): { item: Item; n: NumberValueObject }[] {
		const allRecurrences = this.createAllRecurrences();
		this.#logger.debug("createItemsUntilDate", {
			this: this,
			allRecurrences,
		});
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

	createAllRecurrences(
		max: NumberValueObject = new NumberValueObject(50)
	): { item: Item; n: NumberValueObject }[] {
		if (!this._recurrence)
			return [{ item: this, n: NumberValueObject.zero() }];
		const items = [];
		let nextDate = new ItemDate(this._recurrence.startDate);
		let i = 0;
		while (
			i < max.value &&
			(!this._recurrence.untilDate ||
				nextDate.isLessOrEqualThan(this._recurrence.untilDate))
		) {
			const itemCopy = this.copy();
			itemCopy._date = nextDate;
			items.push({ item: itemCopy, n: new NumberValueObject(i) });
			nextDate = nextDate.next(this._recurrence.frequency);
			i++;
		}
		return items;
	}

	getNItemRecurrence(n: number): Item {
		if (!this._recurrence) return this;
		let item: Item = this.copy();
		let count = 0;
		let nextDate = new ItemDate(this._recurrence.startDate);
		while (
			count < n &&
			(!this._recurrence.untilDate ||
				nextDate.isLessOrEqualThan(this._recurrence.untilDate))
		) {
			nextDate = nextDate.next(this._recurrence.frequency);
			count++;
			if (count === n) item._date = new ItemDate(nextDate);
		}
		return item;
	}

	applyModification(modification: ItemRecurrenceModification) {
		const { price, date, account, toAccount } = modification.modifications;

		price && this.updatePrice(price);
		date && this.updateDate(date);
		account && this.updateAccount(account);
		toAccount && this.updateToAccount(toAccount);
	}

	updateOnRecord(recordDate: ItemDate, newAmount?: ItemPrice): void {
		const amount = newAmount ?? this._price;
		if (!this._recurrence?.frequency) return;
		const prevNextDate = new ItemDate(this._date);
		this.updateDate(this._date.next(this._recurrence.frequency));
		const nextDate = new ItemDate(this._date);

		this.#logger.debug("calculating next date", {
			frequency: this._recurrence.frequency,
			prev: prevNextDate,
			next: nextDate,
		});

		this.#logger.debug("checking permanent changes", {
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

	toPrimitives(): ItemPrimitives {
		return {
			id: this._id.value,
			operation: this._operation.value,
			name: this._name.value,
			amount: this._price.value,
			category: this._category.value,
			subCategory: this._subCategory.value,
			brand: this._info?.value.brand?.value,
			store: this._info?.value.store?.value,
			account: this._account.value,
			toAccount: this.toAccount?.value,
			date: this._date.value,
			recurrence: this._recurrence?.toPrimitives(),
		};
	}

	static emptyPrimitives(): ItemPrimitives {
		return {
			id: "",
			name: "",
			account: "",
			category: "",
			subCategory: "",
			amount: 0,
			operation: "expense",
			brand: "",
			store: "",
			toAccount: "",
			date: new Date(),
			recurrence: undefined,
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
		account,
		toAccount,
		date,
		recurrence,
	}: ItemPrimitives): Item {
		return new Item(
			new ItemID(id),
			new ItemOperation(operation),
			new ItemName(name),
			new ItemPrice(amount),
			new CategoryID(category),
			new SubCategoryID(subCategory),
			new AccountID(account),
			new ItemDate(date),
			toAccount ? new AccountID(toAccount) : undefined,
			recurrence
				? ItemRecurrence.fromPrimitives(new ItemID(id), recurrence)
				: undefined,
			brand || store
				? new ItemProductInfo({
						brand: brand ? new ItemBrand(brand) : undefined,
						store: store ? new ItemStore(store) : undefined,
				  })
				: undefined
		);
	}
}

export type ItemPrimitives = {
	id: string;
	operation: OperationType;
	name: string;
	amount: number;
	category: string;
	subCategory: string;
	brand?: string;
	store?: string;
	account: string;
	toAccount?: string;
	date: Date;
	recurrence?: RecurrencePrimitives;
};
