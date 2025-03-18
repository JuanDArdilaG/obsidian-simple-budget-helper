import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class SubcategoryName extends StringValueObject {
	constructor(value: string) {
		super("Subcategory Name", value);
	}
}
