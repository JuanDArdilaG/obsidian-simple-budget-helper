import { DateValueObject } from "@juandardilag/value-objects/DateValueObject";
import { ScheduledItemFrequency } from "./scheduled-item-frequency.valueobject";

export class ScheduledItemDate extends DateValueObject {
	constructor(value: Date) {
		value.setSeconds(0, 0);
		super(value);
	}

	static createNowDate(): ScheduledItemDate {
		return new ScheduledItemDate(DateValueObject.createNowDate());
	}

	copy(): ScheduledItemDate {
		return new ScheduledItemDate(this.value);
	}

	get remainingDays(): number {
		const now = DateValueObject.createNowDate();
		now.setHours(0, 0, 0, 0);

		return this.differenceOfDays(now);
	}

	get remainingDaysStr(): string {
		const daysToDate = this.remainingDays;
		return daysToDate === 1 || daysToDate === -1
			? `${daysToDate} day`
			: `${daysToDate} days`;
	}

	next(frequency: ScheduledItemFrequency): ScheduledItemDate {
		const frequencyObject = frequency.toObject();
		if (!frequencyObject) return this;

		const nextDate = new Date(this.getTime());
		nextDate.setFullYear(nextDate.getFullYear() + frequencyObject.years);
		nextDate.setMonth(nextDate.getMonth() + frequencyObject.months);
		nextDate.setDate(nextDate.getDate() + frequencyObject.days);

		return new ScheduledItemDate(nextDate);
	}

	compare(other: ScheduledItemDate): number {
		let a = new Date(this.getTime());
		let b = new Date(other.getTime());
		a = new Date(a.getTime());
		a.setHours(0, 0, 0, 0);
		b = new Date(b.getTime());
		b.setHours(0, 0, 0, 0);

		return a.getTime() - b.getTime();
	}
}
