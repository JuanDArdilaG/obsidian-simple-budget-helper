import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";

export class RecurrentItemUntilDate extends DateValueObject {
	constructor(value: Date) {
		value.setHours(0, 0, 0, 0);
		super(value);
	}
}
