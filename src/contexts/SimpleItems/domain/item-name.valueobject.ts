import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class ItemName extends StringValueObject {
	constructor(value: string) {
		super("Item Name", value);
	}
}
