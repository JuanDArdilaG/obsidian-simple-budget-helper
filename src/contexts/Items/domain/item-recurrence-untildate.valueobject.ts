import { DateValueObject } from "@juandardilag/value-objects";

export class ItemRecurrenceUntilDate extends DateValueObject {
	constructor(value: Date | DateValueObject) {
		const date = new Date(value.getTime()); // Create a copy to avoid mutation
		date.setSeconds(0, 0);
		super(date);
	}
}
