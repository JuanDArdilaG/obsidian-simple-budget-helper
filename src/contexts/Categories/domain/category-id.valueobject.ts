import { Nanoid } from "contexts/Shared/domain/value-objects/id/nanoid.valueobject";

export class CategoryID extends Nanoid {
	constructor(value: string) {
		super(value);
	}

	static generate(): CategoryID {
		return Nanoid.generate();
	}
}
