import { DateValueObject } from "@juandardilag/value-objects";
import { CategoryID } from "./category-id.valueobject";
import { CategoryName } from "./category-name.valueobject";
import { Entity } from "contexts/Shared/domain/entity.abstract";

export class Category extends Entity<CategoryID, CategoryPrimitives> {
	constructor(
		id: CategoryID,
		private readonly _name: CategoryName,
		updatedAt: DateValueObject
	) {
		super(id, updatedAt);
	}

	static create(name: CategoryName): Category {
		return new Category(
			CategoryID.generate(),
			name,
			DateValueObject.createNowDate()
		);
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
			name: this._name.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives({
		id,
		name,
		updatedAt,
	}: CategoryPrimitives): Category {
		const category = new Category(
			new CategoryID(id),
			new CategoryName(name),
			updatedAt
				? new DateValueObject(new Date(updatedAt))
				: DateValueObject.createNowDate()
		);
		return category;
	}

	static emptyPrimitives(): CategoryPrimitives {
		return {
			id: "",
			name: "",
			updatedAt: new Date().toISOString(),
		};
	}
}

export type CategoryPrimitives = {
	id: string;
	name: string;
	updatedAt: string;
};
