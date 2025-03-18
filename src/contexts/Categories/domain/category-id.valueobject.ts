import { Nanoid } from "contexts/Shared/domain/value-objects/id/nanoid.valueobject";

export class CategoryID extends Nanoid {
	constructor(value: string) {
		super("Category ID", value);
	}

	static generate(): CategoryID {
		return Nanoid.generate("Category ID");
	}
}
