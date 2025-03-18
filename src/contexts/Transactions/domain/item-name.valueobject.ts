import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class TransactionName extends StringValueObject {
	constructor(value: string) {
		super("Transaction Name", value);
	}
}
