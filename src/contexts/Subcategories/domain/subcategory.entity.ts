import { IEntity } from "contexts/Shared/domain";
import { SubcategoryID, SubcategoryName } from "contexts/Subcategories/domain";
import { CategoryID } from "contexts/Categories/domain";

export class Subcategory
	implements IEntity<SubcategoryID, SubcategoryPrimitives>
{
	constructor(
		private _id: SubcategoryID,
		private _category: CategoryID,
		private _name: SubcategoryName
	) {}

	static create(category: CategoryID, name: SubcategoryName): Subcategory {
		return new Subcategory(SubcategoryID.generate(), category, name);
	}

	get id(): SubcategoryID {
		return this._id;
	}

	get name(): SubcategoryName {
		return this._name;
	}

	toPrimitives(): SubcategoryPrimitives {
		return {
			id: this._id.value,
			category: this._category.value,
			name: this._name.value,
		};
	}

	static fromPrimitives({
		id,
		category,
		name,
	}: SubcategoryPrimitives): Subcategory {
		return new Subcategory(
			new SubcategoryID(id),
			new CategoryID(category),
			new SubcategoryName(name)
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
