import { CategoryID } from "./category-id.valueobject";
import { CategoryName } from "./category-name.valueobject";
import { Entity } from "contexts/Shared/domain/entity.abstract";

export class Category extends Entity<CategoryID, CategoryPrimitives> {
	constructor(id: CategoryID, private _name: CategoryName) {
		super(id);
	}

	static create(name: CategoryName): Category {
		return new Category(CategoryID.generate(), name);
	}

	get id(): CategoryID {
		return this._id;
	}

	get name(): CategoryName {
		return this._name;
	}

	toPrimitives(): CategoryPrimitives {
		return {
			id: this._id.value,
			name: this._name.valueOf(),
		};
	}

	static fromPrimitives({ id, name }: CategoryPrimitives): Category {
		return new Category(new CategoryID(id), new CategoryName(name));
	}

	static emptyPrimitives(): CategoryPrimitives {
		return {
			id: "",
			name: "",
		};
	}
}

export type CategoryPrimitives = {
	id: string;
	name: string;
};
