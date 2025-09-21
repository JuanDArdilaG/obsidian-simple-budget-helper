import { Nanoid } from "contexts/Shared/domain/value-objects/id/nanoid.valueobject";

export class TransactionID extends Nanoid {
	constructor(value: string) {
		super("Transaction ID", value);
	}

	static generate(): TransactionID {
		return Nanoid.generate("Transaction ID");
	}
}
