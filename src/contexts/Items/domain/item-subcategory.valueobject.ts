import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class ItemSubcategory extends StringValueObject {
	constructor(value: string) {
		super("Item Subcategory", value);
	}
}
