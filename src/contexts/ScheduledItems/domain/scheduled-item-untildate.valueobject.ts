import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";

export class ScheduledItemUntilDate extends DateValueObject {
	constructor(value: Date) {
		value.setHours(0, 0, 0, 0);
		super(value);
	}
}
