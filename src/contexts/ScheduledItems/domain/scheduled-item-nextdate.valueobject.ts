import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { ScheduledItemFrequency } from "./scheduled-item-frequency.valueobject";

export class ScheduledItemNextDate extends DateValueObject {
	constructor(value: Date) {
		value.setSeconds(0, 0);
		super(value);
	}

	static createNowDate(): ScheduledItemNextDate {
		return new ScheduledItemNextDate(DateValueObject.createNowDate());
	}

	copy(): ScheduledItemNextDate {
		return new ScheduledItemNextDate(this);
	}

	get remainingDays(): number {
		const date = new Date(this.getTime());
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		const daysToDate = Math.floor(
			(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);
		return daysToDate;
	}

	get remainingDaysStr(): string {
		const daysToDate = this.remainingDays;
		return daysToDate === 1 || daysToDate === -1
			? `${daysToDate} day`
			: `${daysToDate} days`;
	}

	next(frequency: ScheduledItemFrequency): ScheduledItemNextDate {
		const frequencyObject = frequency.toObject();
		if (!frequencyObject) return this;

		const nextDate = new Date(this.getTime());
		nextDate.setFullYear(nextDate.getFullYear() + frequencyObject.years);
		nextDate.setMonth(nextDate.getMonth() + frequencyObject.months);
		nextDate.setDate(nextDate.getDate() + frequencyObject.days);

		return new ScheduledItemNextDate(nextDate);
	}

	compare(other: ScheduledItemNextDate): number {
		let a = new Date(this.getTime());
		let b = new Date(other.getTime());
		a = new Date(a.getTime());
		a.setHours(0, 0, 0, 0);
		b = new Date(b.getTime());
		b.setHours(0, 0, 0, 0);

		return a.getTime() - b.getTime();
	}

	addDays(days: number): ScheduledItemNextDate {
		return new ScheduledItemNextDate(super.addDays(days));
	}
}
