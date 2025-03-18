import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class TransactionCategory extends StringValueObject {
	constructor(value: string) {
		super("Transaction Category", value);
	}
}
