import { Entity } from "contexts/Shared/domain/entity.abstract";
import { Nanoid } from "../../Shared/domain/value-objects/id/nanoid.valueobject";
import { SubcategoryName } from "./subcategory-name.valueobject";

export class Subcategory extends Entity<string, SubcategoryPrimitives> {
	constructor(
		id: Nanoid,
		private readonly _categoryId: Nanoid,
		private readonly _name: SubcategoryName,
		updatedAt: Date,
	) {
		super(id.value, updatedAt);
	}

	static create(categoryId: Nanoid, name: SubcategoryName): Subcategory {
		return new Subcategory(Nanoid.generate(), categoryId, name, new Date());
	}

	get nanoid(): Nanoid {
		return new Nanoid(this._id);
	}

	get categoryId(): Nanoid {
		return this._categoryId;
	}

	get name(): SubcategoryName {
		return this._name;
	}

	toPrimitives(): SubcategoryPrimitives {
		return {
			id: this._id,
			category: this._categoryId.value,
			name: this._name.value,
			updatedAt: this._updatedAt.toISOString(),
		};
	}

	static fromPrimitives({
		id,
		category,
		name,
		updatedAt,
	}: SubcategoryPrimitives): Subcategory {
		const subcategory = new Subcategory(
			new Nanoid(id),
			new Nanoid(category),
			new SubcategoryName(name),
			updatedAt ? new Date(updatedAt) : new Date(),
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
