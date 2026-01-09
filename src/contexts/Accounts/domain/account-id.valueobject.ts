import { Nanoid } from "contexts/Shared/domain/value-objects/id/nanoid.valueobject";

export class AccountID extends Nanoid {
	constructor(value: string) {
		super(value);
	}

	static generate(): AccountID {
		return Nanoid.generate();
	}
}
