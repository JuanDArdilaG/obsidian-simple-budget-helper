import { DateValueObject } from "@juandardilag/value-objects";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";

export class ItemDate extends DateValueObject {
	constructor(value: Date | DateValueObject) {
		const date = new Date(value.getTime()); // Create a copy to avoid mutation
		date.setSeconds(0, 0);
		super(date);
	}

	static createNowDate(): ItemDate {
		return new ItemDate(DateValueObject.createNowDate());
	}

	copy(): ItemDate {
		return new ItemDate(this.value);
	}

	getRemainingDays(
		startDate: DateValueObject = DateValueObject.createNowDate()
	): number {
		return this.updateTime(0, 0, 0, 0).daysDiff(
			startDate.updateTime(0, 0, 0, 0)
		);
	}

	get remainingDaysStr(): string {
		const daysToDate = this.getRemainingDays();
		return daysToDate === 1 || daysToDate === -1
			? `${daysToDate} day`
			: `${daysToDate} days`;
	}

	next(frequency: ItemRecurrenceFrequency): ItemDate {
		const frequencyObject = frequency.toObject();
		if (!frequencyObject) return new ItemDate(this.value);

		const nextDate = new Date(this.getTime());
		nextDate.setFullYear(
			nextDate.getFullYear() + frequencyObject.years.value
		);
		nextDate.setMonth(nextDate.getMonth() + frequencyObject.months.value);
		nextDate.setDate(nextDate.getDate() + frequencyObject.days.value);

		return new ItemDate(nextDate);
	}

	toPrettyFormatDate(): string {
		return this.toLocaleDateString("default", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}
}
