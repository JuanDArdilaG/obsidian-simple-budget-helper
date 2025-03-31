import { Nanoid } from "contexts/Shared/domain/value-objects/id/nanoid.valueobject";

export class ItemID extends Nanoid {
	constructor(value: string) {
		super("Item ID", value);
	}

	static generate(): ItemID {
		return new ItemID(super.generate("Item ID").value);
	}

	copy(): ItemID {
		return new ItemID(this.value);
	}
}
