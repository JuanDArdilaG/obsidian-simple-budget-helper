import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { RecurrrentItemFrequency } from "./recurrent-item-frequency.valueobject";

export class RecurrentItemNextDate extends DateValueObject {
	constructor(value: Date) {
		value.setHours(0, 0, 0, 0);
		super(value);
	}

	nextDate(frequency: RecurrrentItemFrequency): RecurrentItemNextDate {
		const frequencyObject = frequency.toObject();
		if (!frequencyObject) return this;

		const nextDate = new Date(this._value.getTime());
		nextDate.setFullYear(nextDate.getFullYear() + frequencyObject.years);
		nextDate.setMonth(nextDate.getMonth() + frequencyObject.months);
		nextDate.setDate(nextDate.getDate() + frequencyObject.days);

		return new RecurrentItemNextDate(nextDate);
	}

	compare(other: RecurrentItemNextDate): number {
		let a = new Date(this._value.getTime());
		let b = new Date(other._value.getTime());
		a = new Date(a.getTime());
		a.setHours(0, 0, 0, 0);
		b = new Date(b.getTime());
		b.setHours(0, 0, 0, 0);

		return a.getTime() - b.getTime();
	}
}
