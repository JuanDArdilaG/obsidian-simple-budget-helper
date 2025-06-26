import { DateValueObject } from "@juandardilag/value-objects";
import { CategoryID } from "contexts/Categories/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Logger } from "contexts/Shared/infrastructure/logger";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";

export enum ItemType {
	PRODUCT = "product",
	SERVICE = "service",
}

export abstract class Item extends Entity<ItemID, ItemPrimitives> {
	readonly _ = new Logger("Item");

	protected constructor(
		id: ItemID,
		protected _name: ItemName,
		protected _category: CategoryID,
		protected _subCategory: SubCategoryID,
		protected _type: ItemType,
		updatedAt: DateValueObject
	) {
		super(id, updatedAt);
	}

	get id(): ItemID {
		return this._id;
	}

	get name(): ItemName {
		return this._name;
	}

	updateName(name: ItemName): void {
		this._name = name;
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

	get type(): ItemType {
		return this._type;
	}

	abstract copy(): Item;
	abstract toPrimitives(): ItemPrimitives;
	static fromPrimitives(primitives: ItemPrimitives): Item {
		throw new Error("Method 'fromPrimitives' must be implemented.");
	}
	static emptyPrimitives(): ItemPrimitives {
		throw new Error("Method 'emptyPrimitives' must be implemented.");
	}
}

export type ItemPrimitives = {
	id: string;
	name: string;
	category: string;
	subCategory: string;
	type: ItemType;
	updatedAt: string;
};
