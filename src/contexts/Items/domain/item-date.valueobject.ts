import { DateValueObject } from "@juandardilag/value-objects";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";

export class ItemDate extends DateValueObject {
	constructor(value: Date) {
		value.setSeconds(0, 0);
		super(value);
	}

	static createNowDate(): ItemDate {
		return new ItemDate(DateValueObject.createNowDate());
	}

	copy(): ItemDate {
		return new ItemDate(this.value);
	}

	get remainingDays(): number {
		let now = DateValueObject.createNowDate();

		return this.daysDiff(now.modifyHours(0, 0, 0, 0));
	}

	get remainingDaysStr(): string {
		const daysToDate = this.remainingDays;
		return daysToDate === 1 || daysToDate === -1
			? `${daysToDate} day`
			: `${daysToDate} days`;
	}

	next(frequency: ItemRecurrenceFrequency): ItemDate {
		const frequencyObject = frequency.toObject();
		if (!frequencyObject) return this;

		const nextDate = new Date(this.getTime());
		nextDate.setFullYear(
			nextDate.getFullYear() + frequencyObject.years.value
		);
		nextDate.setMonth(nextDate.getMonth() + frequencyObject.months.value);
		nextDate.setDate(nextDate.getDate() + frequencyObject.days.value);

		return new ItemDate(nextDate);
	}

	compare(other: ItemDate): number {
		let a = new Date(this.getTime());
		let b = new Date(other.getTime());
		a = new Date(a.getTime());
		a.setHours(0, 0, 0, 0);
		b = new Date(b.getTime());
		b.setHours(0, 0, 0, 0);

		return a.getTime() - b.getTime();
	}

	toPrettyFormatDate(): string {
		return `${this.value.getDate()}/${
			this.value.getMonth() + 1
		}/${this.value.getFullYear()}`;
	}
}
