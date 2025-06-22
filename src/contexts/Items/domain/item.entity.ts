import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import {
	ItemOperation,
	ItemOperationPrimitives,
} from "../../Shared/domain/Item/item-operation.valueobject";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { DateValueObject } from "@juandardilag/value-objects";
import { ItemProductInfo } from "./item-product-info.valueobject";
import { ItemRecurrence, RecurrencePrimitives } from "./item-recurrence.entity";
import {
	ItemRecurrenceInfo,
	ItemRecurrenceInfoPrimitives,
} from "./item-recurrence-modification.valueobject";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { ItemBrand } from "./item-brand.valueobject";
import { ItemStore } from "./item-store.valueobject";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";
import { OperationType } from "contexts/Shared/domain";

export class Item extends Entity<ItemID, ItemPrimitives> {
	readonly _ = new Logger("Item");
	private constructor(
		id: ItemID,
		private _name: ItemName,
		private _price: ItemPrice,
		private _operation: ItemOperation,
		private _category: CategoryID,
		private _subCategory: SubCategoryID,
		private _recurrence: ItemRecurrence,
		updatedAt: DateValueObject,
		private readonly _info?: ItemProductInfo
	) {
		super(id, updatedAt);
	}

	static oneTime(
		date: DateValueObject,
		name: ItemName,
		price: ItemPrice,
		operation: ItemOperation,
		category: CategoryID,
		subCategory: SubCategoryID
	): Item {
		const item = new Item(
			ItemID.generate(),
			name,
			price,
			operation,
			category,
			subCategory,
			ItemRecurrence.oneTime(date),
			DateValueObject.createNowDate()
		);
		return item;
	}

	static infinite(
		startDate: DateValueObject,
		name: ItemName,
		price: ItemPrice,
		operation: ItemOperation,
		category: CategoryID,
		subCategory: SubCategoryID,
		frequency: ItemRecurrenceFrequency
	): Item {
		const item = new Item(
			ItemID.generate(),
			name,
			price,
			operation,
			category,
			subCategory,
			ItemRecurrence.infinite(startDate, frequency),
			DateValueObject.createNowDate()
		);
		return item;
	}

	static untilDate(
		name: ItemName,
		price: ItemPrice,
		operation: ItemOperation,
		category: CategoryID,
		subCategory: SubCategoryID,
		frequency: ItemRecurrenceFrequency,
		startDate: DateValueObject,
		untilDate: DateValueObject
	): Item {
		const item = new Item(
			ItemID.generate(),
			name,
			price,
			operation,
			category,
			subCategory,
			ItemRecurrence.untilDate(startDate, frequency, untilDate),
			DateValueObject.createNowDate()
		);
		return item;
	}

	copy(): Item {
		return new Item(
			this._id,
			this._name,
			this._price,
			this._operation,
			this._category,
			this._subCategory,
			this._recurrence,
			this._updatedAt,
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
		this.updateTimestamp();
	}

	get name(): ItemName {
		return this._name;
	}

	updateName(name: ItemName): void {
		this._name = name;
		this.updateTimestamp();
	}

	get price(): ItemPrice {
		return this._price;
	}

	updatePrice(price: ItemPrice) {
		this._price = price;
		this.updateTimestamp();
	}

	get realPrice(): ItemPrice {
		if (this._operation.type.isIncome()) return this._price;
		else if (this._operation.type.isExpense()) return this._price.negate();
		return ItemPrice.zero();
	}

	get pricePerMonth(): ItemPrice {
		if (!this._recurrence?.frequency) return this.realPrice;
		return this.realPrice.times(this._recurrence.perMonthRelation);
	}

	set price(amount: ItemPrice) {
		this._price = amount;
		this.updateTimestamp();
	}

	get category(): CategoryID {
		return this._category;
	}

	updateCategory(category: CategoryID): void {
		this._category = category;
		this.updateTimestamp();
	}

	get subCategory(): SubCategoryID {
		return this._subCategory;
	}

	updateSubCategory(subCategory: SubCategoryID): void {
		this._subCategory = subCategory;
		this.updateTimestamp();
	}

	get info(): ItemProductInfo | undefined {
		return this._info;
	}

	get recurrence(): ItemRecurrence {
		return this._recurrence;
	}

	updateRecurrence(recurrence: ItemRecurrence) {
		recurrence.createRecurrences();
		this._recurrence = recurrence;
		this.updateTimestamp();
	}

	applyModification(modification: ItemRecurrenceInfo): void {
		modification.price && this.updatePrice(modification.price);
		modification.account &&
			this._operation.updateAccount(modification.account);
		modification.toAccount &&
			this._operation.updateToAccount(modification.toAccount);
		this.updateTimestamp();
	}

	toPrimitives(): ItemPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
			price: this._price.value,
			operation: this._operation.toPrimitives(),
			category: this._category.value,
			subCategory: this._subCategory.value,
			brand: this._info?.value.brand?.value,
			store: this._info?.value.store?.value,
			recurrence: this._recurrence?.toPrimitives(),
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static emptyPrimitives(): ItemPrimitives {
		return {
			id: "",
			name: "",
			category: "",
			subCategory: "",
			price: 0,
			operation: {
				type: "expense",
				account: "",
				toAccount: undefined,
			},
			brand: "",
			store: "",
			recurrence: {
				startDate: new Date(),
				recurrences: [],
				frequency: undefined,
				untilDate: undefined,
			},
			updatedAt: new Date().toISOString(),
		};
	}

	static fromPrimitives({
		id,
		name,
		price,
		operation,
		category,
		subCategory,
		brand,
		store,
		recurrence,
		updatedAt,
	}: ItemPrimitives): Item {
		const item = new Item(
			new ItemID(id),
			new ItemName(name),
			new ItemPrice(price),
			ItemOperation.fromPrimitives(operation),
			new CategoryID(category),
			new SubCategoryID(subCategory),
			ItemRecurrence.fromPrimitives(recurrence),
			updatedAt
				? new DateValueObject(new Date(updatedAt))
				: DateValueObject.createNowDate(),
			brand || store
				? new ItemProductInfo({
						brand: brand ? new ItemBrand(brand) : undefined,
						store: store ? new ItemStore(store) : undefined,
				  })
				: undefined
		);
		return item;
	}

	static fromPrimitivesOld({
		id,
		name,
		date,
		amount,
		operation,
		category,
		subCategory,
		brand,
		store,
		recurrence,
		account,
		toAccount,
	}: ItemPrimitivesOld): Item {
		return new Item(
			new ItemID(id),
			new ItemName(name),
			new ItemPrice(amount),
			ItemOperation.fromPrimitives({
				type: operation,
				account,
				toAccount,
			}),
			new CategoryID(category),
			new SubCategoryID(subCategory),
			ItemRecurrence.fromPrimitives({
				startDate: recurrence?.startDate ?? date,
				recurrences: [],
				frequency: recurrence?.frequency,
				untilDate: recurrence?.untilDate,
			}),
			new DateValueObject(new Date()),
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
	name: string;
	price: number;
	operation: ItemOperationPrimitives;
	category: string;
	subCategory: string;
	brand?: string;
	store?: string;
	recurrence: RecurrencePrimitives;
	updatedAt: string;
};

export type ItemPrimitivesOld = {
	id: string;
	operation: OperationType;
	name: string;
	date: Date;
	amount: number;
	category: string;
	subCategory: string;
	brand?: string;
	store?: string;
	account: string;
	toAccount?: string;
	recurrence?: {
		startDate: Date;
		frequency: string;
		modifications?: ItemRecurrenceInfoPrimitives[];
		untilDate?: Date;
	};
};
