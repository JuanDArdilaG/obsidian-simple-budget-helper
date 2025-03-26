import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { RecurrrentItemFrequency } from "./recurrent-item-frequency.valueobject";

export class RecurrentItemNextDate extends DateValueObject {
	constructor(value: Date) {
		value.setHours(0, 0, 0, 0);
		super(value);
	}

	static now(): RecurrentItemNextDate {
		return new RecurrentItemNextDate(super.now().valueOf());
	}

	copy(): RecurrentItemNextDate {
		return new RecurrentItemNextDate(this.valueOf());
	}

	getRemainingDays(): number {
		const date = new Date(this._value.getTime());
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const daysToDate = Math.floor(
			(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);
		return daysToDate;
	}

	next(frequency: RecurrrentItemFrequency): void {
		const frequencyObject = frequency.toObject();
		if (!frequencyObject) return;

		const nextDate = new Date(this._value.getTime());
		nextDate.setFullYear(nextDate.getFullYear() + frequencyObject.years);
		nextDate.setMonth(nextDate.getMonth() + frequencyObject.months);
		nextDate.setDate(nextDate.getDate() + frequencyObject.days);

		this._value = nextDate;
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

	addDays(days: number): RecurrentItemNextDate {
		this._value = super.addDays(days).valueOf();
		return this;
	}
}
