import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class TransactionSubcategory extends StringValueObject {
	constructor(value: string) {
		super("Transaction Subcategory", value);
	}
}
