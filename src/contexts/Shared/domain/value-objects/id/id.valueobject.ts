import { StringValueObject } from "@juandardilag/value-objects";

export abstract class IDValueObject extends StringValueObject {
	equalTo(other: IDValueObject): boolean {
		return this.value === other.value;
	}
}
