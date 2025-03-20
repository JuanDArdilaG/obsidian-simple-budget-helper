import { IEntity } from "contexts/Shared/domain/entity.interface";
import { CategoryID } from "./category-id.valueobject";
import { CategoryName } from "./category-name.valueobject";

export class Category implements IEntity<CategoryID, CategoryPrimitives> {
	constructor(private _id: CategoryID, private _name: CategoryName) {}

	get id(): CategoryID {
		return this._id;
	}

	get name(): CategoryName {
		return this._name;
	}

	toPrimitives(): CategoryPrimitives {
		return {
			id: this._id.value,
			name: this._name.value,
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
