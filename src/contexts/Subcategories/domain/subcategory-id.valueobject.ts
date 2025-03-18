import { Nanoid } from "contexts/Shared/domain/value-objects/id/nanoid.valueobject";

export class SubcategoryID extends Nanoid {
	constructor(value: string) {
		super("Subcategory ID", value);
	}

	static generate(): SubcategoryID {
		return Nanoid.generate("Subcategory ID");
	}
}
