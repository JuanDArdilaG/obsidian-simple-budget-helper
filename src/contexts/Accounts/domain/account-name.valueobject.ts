import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class AccountName extends StringValueObject {
	constructor(value: string) {
		super("Account Name", value);
	}
}
