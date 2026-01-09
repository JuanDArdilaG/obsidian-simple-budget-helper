import { Nanoid } from "contexts/Shared/domain/value-objects/id/nanoid.valueobject";

export class SubCategoryID extends Nanoid {
	constructor(value: string) {
		super(value);
	}

	static generate(): SubCategoryID {
		return Nanoid.generate();
	}
}
