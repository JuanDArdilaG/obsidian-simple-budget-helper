import { SubCategoryID, SubCategoryName } from "contexts/Subcategories/domain";
import { CategoryID } from "contexts/Categories/domain";
import { Entity } from "contexts/Shared/domain/entity.abstract";

export class SubCategory extends Entity<SubCategoryID, SubcategoryPrimitives> {
	constructor(
		id: SubCategoryID,
		private _category: CategoryID,
		private _name: SubCategoryName
	) {
		super(id);
	}

	static create(category: CategoryID, name: SubCategoryName): SubCategory {
		return new SubCategory(SubCategoryID.generate(), category, name);
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
			name: this._name.valueOf(),
		};
	}

	static fromPrimitives({
		id,
		category,
		name,
	}: SubcategoryPrimitives): SubCategory {
		return new SubCategory(
			new SubCategoryID(id),
			new CategoryID(category),
			new SubCategoryName(name)
		);
	}

	static emptyPrimitives(): SubcategoryPrimitives {
		return {
			id: "",
			category: "",
			name: "",
		};
	}
}

export type SubcategoryPrimitives = {
	id: string;
	category: string;
	name: string;
};
