import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class ItemBrand extends StringValueObject {
	constructor(value: string) {
		super("Item Brand", value);
	}
}
