import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export abstract class IDValueObject extends StringValueObject {
	equalTo(other: IDValueObject): boolean {
		return this.value === other.value;
	}
}
