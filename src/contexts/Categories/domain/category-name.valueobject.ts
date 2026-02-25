import { StringValueObject } from "@juandardilag/value-objects";

export class CategoryName extends StringValueObject {
	constructor(value: string) {
		super(value, { minLength: 1, maxLength: 50 });
	}
}
