import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class CategoryName extends StringValueObject {
	constructor(value: string) {
		super("Category Name", value);
	}
}
