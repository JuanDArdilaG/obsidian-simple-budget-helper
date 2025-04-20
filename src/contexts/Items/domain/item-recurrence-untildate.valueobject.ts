import { DateValueObject } from "@juandardilag/value-objects";

export class ItemRecurrenceUntilDate extends DateValueObject {
	constructor(value: Date) {
		value.setSeconds(0, 0);
		super(value);
	}
}
