import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class SubCategoryName extends StringValueObject {
	constructor(value: string) {
		super("SubCategory Name", value);
	}
}
