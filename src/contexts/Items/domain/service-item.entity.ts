import { DateValueObject } from "@juandardilag/value-objects";
import { CategoryID } from "contexts/Categories/domain";
import { SubCategoryID } from "contexts/Subcategories/domain";
import { ItemID } from "./item-id.valueobject";
import { ItemName } from "./item-name.valueobject";
import { Item, ItemPrimitives, ItemType } from "./item.entity";

export class ServiceItem extends Item {
	constructor(
		id: ItemID,
		name: ItemName,
		category: CategoryID,
		subCategory: SubCategoryID,
		updatedAt: DateValueObject,
		private readonly _providers: ItemID[] = []
	) {
		super(id, name, category, subCategory, ItemType.SERVICE, updatedAt);
	}

	static create(
		name: ItemName,
		category: CategoryID,
		subCategory: SubCategoryID,
		providers: ItemID[] = []
	): ServiceItem {
		return new ServiceItem(
			ItemID.generate(),
			name,
			category,
			subCategory,
			DateValueObject.createNowDate(),
			providers
		);
	}

	get providers(): ItemID[] {
		return this._providers;
	}

	addProvider(providerId: ItemID): void {
		if (!this._providers.some((p) => p.value === providerId.value)) {
			this._providers.push(providerId);
			this.updateTimestamp();
		}
	}

	removeProvider(providerId: ItemID): void {
		const index = this._providers.findIndex(
			(p) => p.value === providerId.value
		);
		if (index !== -1) {
			this._providers.splice(index, 1);
			this.updateTimestamp();
		}
	}

	copy(): ServiceItem {
		return new ServiceItem(
			this._id,
			this._name,
			this._category,
			this._subCategory,
			this._updatedAt,
			[...this._providers]
		);
	}

	toPrimitives(): ServiceItemPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
			category: this._category.value,
			subCategory: this._subCategory.value,
			type: this._type,
			providers: this._providers.map((p) => p.value),
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives(primitives: ServiceItemPrimitives): ServiceItem {
		return new ServiceItem(
			new ItemID(primitives.id),
			new ItemName(primitives.name),
			new CategoryID(primitives.category),
			new SubCategoryID(primitives.subCategory),
			new DateValueObject(new Date(primitives.updatedAt)),
			primitives.providers.map((id) => new ItemID(id))
		);
	}

	static emptyPrimitives(): ServiceItemPrimitives {
		return {
			id: "",
			name: "",
			category: "",
			subCategory: "",
			type: ItemType.SERVICE,
			providers: [],
			updatedAt: new Date().toISOString(),
		};
	}
}

export type ServiceItemPrimitives = ItemPrimitives & {
	providers: string[];
};
