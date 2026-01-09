import { DateValueObject } from "@juandardilag/value-objects";
import { ItemRecurrenceFrequency } from "./item-recurrence-frequency.valueobject";

export class ScheduledTransactionDate extends DateValueObject {
	constructor(value: Date | DateValueObject) {
		const date = new Date(value.getTime()); // Create a copy to avoid mutation
		date.setSeconds(0, 0);
		super(date);
	}

	static createNowDate(): ScheduledTransactionDate {
		return new ScheduledTransactionDate(DateValueObject.createNowDate());
	}

	copy(): ScheduledTransactionDate {
		return new ScheduledTransactionDate(this.value);
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

	next(frequency: ItemRecurrenceFrequency): ScheduledTransactionDate {
		const frequencyObject = frequency.toObject();
		if (!frequencyObject) return new ScheduledTransactionDate(this.value);

		const nextDate = new Date(this.getTime());
		// Add years
		nextDate.setFullYear(
			nextDate.getFullYear() + frequencyObject.years.value
		);

		// Add months
		if (frequencyObject.months.value > 0) {
			const originalMonth = nextDate.getMonth();
			nextDate.setMonth(originalMonth + frequencyObject.months.value);

			// If month overflowed, set to last day of previous month (target month)
			if (
				nextDate.getMonth() !==
				(originalMonth + frequencyObject.months.value) % 12
			) {
				nextDate.setDate(0);
			}
		}

		// Add days
		if (frequencyObject.days.value > 0) {
			nextDate.setDate(nextDate.getDate() + frequencyObject.days.value);
		}

		return new ScheduledTransactionDate(nextDate);
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
