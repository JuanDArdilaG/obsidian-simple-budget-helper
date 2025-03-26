import { Nanoid } from "contexts/Shared/domain/value-objects/id/nanoid.valueobject";

export class SubCategoryID extends Nanoid {
	constructor(value: string) {
		super("SubCategory ID", value);
	}

	static generate(): SubCategoryID {
		return Nanoid.generate("SubCategory ID");
	}
}
