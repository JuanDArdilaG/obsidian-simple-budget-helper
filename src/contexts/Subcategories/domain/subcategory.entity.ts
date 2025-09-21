import { SubCategoryID, SubCategoryName } from "contexts/Subcategories/domain";
import { CategoryID } from "contexts/Categories/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";
import { DateValueObject } from "@juandardilag/value-objects";

export class SubCategory extends Entity<SubCategoryID, SubcategoryPrimitives> {
	constructor(
		id: SubCategoryID,
		private readonly _category: CategoryID,
		private readonly _name: SubCategoryName,
		updatedAt: DateValueObject
	) {
		super(id, updatedAt);
	}

	static create(category: CategoryID, name: SubCategoryName): SubCategory {
		return new SubCategory(
			SubCategoryID.generate(),
			category,
			name,
			DateValueObject.createNowDate()
		);
	}

	get id(): SubCategoryID {
		return this._id;
	}

	get category(): CategoryID {
		return this._category;
	}

	get name(): SubCategoryName {
		return this._name;
	}

	toPrimitives(): SubcategoryPrimitives {
		return {
			id: this._id.value,
			category: this._category.value,
			name: this._name.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives({
		id,
		category,
		name,
		updatedAt,
	}: SubcategoryPrimitives): SubCategory {
		const subcategory = new SubCategory(
			new SubCategoryID(id),
			new CategoryID(category),
			new SubCategoryName(name),
			updatedAt
				? new DateValueObject(new Date(updatedAt))
				: DateValueObject.createNowDate()
		);
		return subcategory;
	}

	static emptyPrimitives(): SubcategoryPrimitives {
		return {
			id: "",
			category: "",
			name: "",
			updatedAt: new Date().toISOString(),
		};
	}
}

export type SubcategoryPrimitives = {
	id: string;
	category: string;
	name: string;
	updatedAt: string;
};
