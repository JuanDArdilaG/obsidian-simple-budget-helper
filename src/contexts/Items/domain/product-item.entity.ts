import { DateValueObject } from "@juandardilag/value-objects";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";
import { ItemPrice } from "./item-price.valueobject";
import { Item, ItemPrimitives, ItemType } from "./item.entity";

export class ProductItem extends Item {
	constructor(
		id: ItemID,
		name: ItemName,
		category: CategoryID,
		subCategory: SubCategoryID,
		amount: ItemPrice,
		updatedAt: DateValueObject,
		private readonly _brands: ItemID[] = [],
		private readonly _stores: ItemID[] = []
	) {
		super(
			id,
			name,
			category,
			subCategory,
			ItemType.PRODUCT,
			amount,
			updatedAt
		);
	}

	static create(
		name: ItemName,
		category: CategoryID,
		subCategory: SubCategoryID,
		amount: ItemPrice,
		brands: ItemID[] = [],
		stores: ItemID[] = []
	): ProductItem {
		return new ProductItem(
			ItemID.generate(),
			name,
			category,
			subCategory,
			amount,
			DateValueObject.createNowDate(),
			brands,
			stores
		);
	}

	get brands(): ItemID[] {
		return this._brands;
	}

	get stores(): ItemID[] {
		return this._stores;
	}

	addBrand(brandId: ItemID): void {
		if (!this._brands.some((b) => b.value === brandId.value)) {
			this._brands.push(brandId);
			this.updateTimestamp();
		}
	}

	addStore(storeId: ItemID): void {
		if (!this._stores.some((s) => s.value === storeId.value)) {
			this._stores.push(storeId);
			this.updateTimestamp();
		}
	}

	removeBrand(brandId: ItemID): void {
		const index = this._brands.findIndex((b) => b.value === brandId.value);
		if (index !== -1) {
			this._brands.splice(index, 1);
			this.updateTimestamp();
		}
	}

	removeStore(storeId: ItemID): void {
		const index = this._stores.findIndex((s) => s.value === storeId.value);
		if (index !== -1) {
			this._stores.splice(index, 1);
			this.updateTimestamp();
		}
	}

	copy(): ProductItem {
		return new ProductItem(
			this._id,
			this._name,
			this._category,
			this._subCategory,
			this._amount,
			this._updatedAt,
			[...this._brands],
			[...this._stores]
		);
	}

	toPrimitives(): ProductItemPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
			category: this._category.value,
			subCategory: this._subCategory.value,
			type: this._type,
			amount: this._amount.value,
			brands: this._brands.map((b) => b.value),
			stores: this._stores.map((s) => s.value),
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives(primitives: ProductItemPrimitives): ProductItem {
		return new ProductItem(
			new ItemID(primitives.id),
			new ItemName(primitives.name),
			new CategoryID(primitives.category),
			new SubCategoryID(primitives.subCategory),
			new ItemPrice(primitives.amount ?? 0),
			new DateValueObject(new Date(primitives.updatedAt)),
			primitives.brands.map((id) => new ItemID(id)),
			primitives.stores.map((id) => new ItemID(id))
		);
	}

	static emptyPrimitives(): ProductItemPrimitives {
		return {
			id: "",
			name: "",
			category: "",
			subCategory: "",
			type: ItemType.PRODUCT,
			amount: 0,
			brands: [],
			stores: [],
			updatedAt: new Date().toISOString(),
		};
	}
}

export type ProductItemPrimitives = ItemPrimitives & {
	brands: string[];
	stores: string[];
};
