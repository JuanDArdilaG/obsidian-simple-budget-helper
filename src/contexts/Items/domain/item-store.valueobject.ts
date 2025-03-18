import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class ItemStore extends StringValueObject {
	constructor(value: string) {
		super("Item Store", value);
	}
}
