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
	NumberValueObject,
} from "@juandardilag/value-objects";
import { ItemProductInfo } from "./item-product-info.valueobject";
import { ItemDate } from "./item-date.valueobject";
import { ItemRecurrence, RecurrencePrimitives } from "./item-recurrence.entity";
import {
	ItemRecurrenceModification,
	ItemRecurrenceModificationPrimitives,
	ERecurrenceState,
} from "./item-recurrence-modification.valueobject";
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
		private _recurrences: ItemRecurrenceModification[],
		private _toAccount?: AccountID,
		private _recurrence?: ItemRecurrence,
		private readonly _info?: ItemProductInfo
	) {
		super(id);
	}

	create(
		operation: ItemOperation,
		name: ItemName,
		price: ItemPrice,
		category: CategoryID,
		subCategory: SubCategoryID,
		account: AccountID,
		recurrences: ItemRecurrenceModification[],
		toAccount?: AccountID,
		recurrence?: ItemRecurrence,
		info?: ItemProductInfo
	): Item {
		const item = new Item(
			ItemID.generate(),
			operation,
			name,
			price,
			category,
			subCategory,
			account,
			recurrences,
			toAccount,
			recurrence,
			info
		);
		item.createAllRecurrences();
		return item;
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
			this._recurrences,
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
			this._recurrences,
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

	// advanceDateToNextDate() {
	// 	if (!this._recurrence) return;
	// 	this.updateDate(this._recurrence.calculateNextDate(this._date));
	// }

	get recurrence(): ItemRecurrence | undefined {
		return this._recurrence;
	}

	updateRecurrence(recurrence: ItemRecurrence | undefined) {
		this._recurrence = recurrence;
		this.createAllRecurrences();
	}

	get recurrences(): ItemRecurrenceModification[] {
		return this._recurrences ?? [];
	}

	createAllRecurrences(
		max: NumberValueObject = new NumberValueObject(50)
	): void {
		if (!this._recurrence) {
			this._recurrences = [
				new ItemRecurrenceModification(
					this.id,
					ItemDate.createNowDate(),
					ERecurrenceState.PENDING
				),
			];
			return;
		}

		this._recurrences = [];

		let i = NumberValueObject.zero();
		const recurrences: ItemRecurrenceModification[] = [];
		let nextDate = new ItemDate(this._recurrence.startDate);

		while (
			max.greaterThan(i) &&
			(!this._recurrence.untilDate ||
				nextDate.isLessOrEqualThan(this._recurrence.untilDate))
		) {
			recurrences.push(
				new ItemRecurrenceModification(
					this.id,
					nextDate,
					ERecurrenceState.PENDING
				)
			);
			nextDate = nextDate.next(this._recurrence.frequency);
			i = i.plus(new NumberValueObject(1));
		}

		this._recurrences = recurrences;
	}

	getRecurrencesUntilDate(
		to: DateValueObject
	): { recurrence: ItemRecurrenceModification; n: NumberValueObject }[] {
		if (!this._recurrences) return [];
		this._recurrences.sort((a, b) => a.date.compareTo(b.date));
		const filteredRecurrences = this._recurrences
			.map((recurrence, i) => ({
				recurrence: new ItemRecurrenceModification(
					recurrence.id,
					recurrence.date,
					recurrence.state,
					recurrence.price ?? this._price,
					recurrence.account ?? this._account,
					recurrence.toAccount ?? this._toAccount
				),
				n: new NumberValueObject(i),
			}))
			.filter(
				({ recurrence }) =>
					// recurrence.item.date.isGreaterOrEqualThan(this.date) &&
					recurrence.state === ERecurrenceState.PENDING &&
					recurrence.date.isLessOrEqualThan(to)
			);

		this.#logger.debug("filteredRecurrences", {
			this: this,
			filteredRecurrences,
		});

		return filteredRecurrences;
	}

	// getNItemRecurrence(n: number): Item {
	// 	if (!this._recurrence) return this;
	// 	const item: Item = this.copy();
	// 	let count = 0;
	// 	let nextDate = new ItemDate(this._recurrence.startDate);
	// 	while (
	// 		count < n &&
	// 		(!this._recurrence.untilDate ||
	// 			nextDate.isLessOrEqualThan(this._recurrence.untilDate))
	// 	) {
	// 		nextDate = nextDate.next(this._recurrence.frequency);
	// 		count++;
	// 		if (count === n) item._date = new ItemDate(nextDate);
	// 	}
	// 	return item;
	// }

	// updateOnRecord(recordDate: ItemDate, newAmount?: ItemPrice): void {
	// 	const amount = newAmount ?? this._price;
	// 	if (!this._recurrence?.frequency) return;
	// 	const prevNextDate = new ItemDate(this._date);
	// 	this.updateDate(this._date.next(this._recurrence.frequency));
	// 	const nextDate = new ItemDate(this._date);

	// 	this.#logger.debug("calculating next date", {
	// 		frequency: this._recurrence.frequency,
	// 		prev: prevNextDate,
	// 		next: nextDate,
	// 	});

	// 	this.#logger.debug("checking permanent changes", {
	// 		amount: {
	// 			change: !!amount,
	// 			from: this._price,
	// 			to: amount,
	// 		},
	// 		recordDate: {
	// 			change: recordDate.compare(prevNextDate) !== 0,
	// 			from: prevNextDate,
	// 			to: recordDate.next(this._recurrence.frequency),
	// 		},
	// 	});

	// 	this.updateDate(nextDate);
	// }

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
			recurrence: this._recurrence?.toPrimitives(),
			recurrences: this._recurrences?.map((r) => r.toPrimitives()),
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
			recurrence: undefined,
			recurrences: [],
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
		recurrence,
		recurrences,
	}: ItemPrimitives): Item {
		return new Item(
			new ItemID(id),
			new ItemOperation(operation),
			new ItemName(name),
			new ItemPrice(amount),
			new CategoryID(category),
			new SubCategoryID(subCategory),
			new AccountID(account),
			recurrences.map((r) =>
				ItemRecurrenceModification.fromPrimitives({ ...r, itemID: id })
			),
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
	recurrence?: RecurrencePrimitives;
	recurrences: ItemRecurrenceModificationPrimitives[];
};
