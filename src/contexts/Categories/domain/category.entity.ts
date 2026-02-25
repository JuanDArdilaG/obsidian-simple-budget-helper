import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Nanoid } from "../../Shared/domain/value-objects/id/nanoid.valueobject";
import { CategoryName } from "./category-name.valueobject";

export class Category extends Entity<string, CategoryPrimitives> {
	constructor(
		id: Nanoid,
		private readonly _name: CategoryName,
		updatedAt: Date,
	) {
		super(id.value, updatedAt);
	}

	static create(name: CategoryName): Category {
		return new Category(Nanoid.generate(), name, new Date());
	}

	get nanoid(): Nanoid {
		return new Nanoid(this._id);
	}

	get name(): CategoryName {
		return this._name;
	}

	toPrimitives(): CategoryPrimitives {
		return {
			id: this._id,
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
			new Nanoid(id),
			new CategoryName(name),
			updatedAt ? new Date(updatedAt) : new Date(),
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
