import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class ItemCategory extends StringValueObject {
	constructor(value: string) {
		super("Item Category", value);
	}
}
