import { Category, CategoryPrimitives } from "../../Categories/domain";
import { SubCategory, SubcategoryPrimitives } from "../../Subcategories/domain";

export class TransactionCategory {
	constructor(
		private _category: Category,
		private _subCategory: SubCategory
	) {}

	static fromPrimitives(
		primitives: TransactionCategoryPrimitives
	): TransactionCategory {
		return new TransactionCategory(
			Category.fromPrimitives(primitives.category),
			SubCategory.fromPrimitives(primitives.subCategory)
		);
	}

	get category(): Category {
		return this._category;
	}

	set category(category: Category) {
		this._category = category;
	}

	get subCategory(): SubCategory {
		return this._subCategory;
	}

	set subCategory(subCategory: SubCategory) {
		this._subCategory = subCategory;
	}

	toPrimitives(): TransactionCategoryPrimitives {
		return {
			category: this._category.toPrimitives(),
			subCategory: this._subCategory.toPrimitives(),
		};
	}
}

export interface TransactionCategoryPrimitives {
	category: CategoryPrimitives;
	subCategory: SubcategoryPrimitives;
}
