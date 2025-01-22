import { FrequencyString } from "./FrequencyString";

export class BudgetItemNextDate extends Date {
	constructor(date: Date, removeTime = true) {
		if (removeTime) date.setHours(0, 0, 0, 0);
		super(date);
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

	nextDate(frequency: FrequencyString): BudgetItemNextDate {
		const frequencyObject = frequency.toObject();
		if (!frequencyObject) return this;

		const nextDate = new Date(this.getTime());
		nextDate.setFullYear(nextDate.getFullYear() + frequencyObject.years);
		nextDate.setMonth(nextDate.getMonth() + frequencyObject.months);
		nextDate.setDate(nextDate.getDate() + frequencyObject.days);

		return new BudgetItemNextDate(nextDate);
	}

	toDate(): Date {
		return this;
	}
}
