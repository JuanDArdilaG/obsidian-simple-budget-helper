import { StringValueObject } from "@juandardilag/value-objects";

export class TransactionName extends StringValueObject {
	constructor(value: string) {
		super(value.trim(), { minLength: 1, maxLength: 100 });
	}
}
