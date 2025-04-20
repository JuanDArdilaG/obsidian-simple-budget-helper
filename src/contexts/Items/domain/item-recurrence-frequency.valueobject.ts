import {
	NumberValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";

export class ItemRecurrenceFrequency extends StringValueObject {
	static readonly MONTH_DAYS_RELATION = new NumberValueObject(30.4167);

	toObject(): FrequencyObject | undefined {
		const regex = /(?:(\d*)y)?(?:(\d*)mo)?(?:(\d*)w)?(?:(\d*)d)?/;
		const match = regex.exec(this.toString());
		if (!match) return undefined;
		const years = new NumberValueObject(Number(match[1] || 0));
		const months = new NumberValueObject(Number(match[2] || 0));
		const weeks = new NumberValueObject(Number(match[3] || 0));
		const days = new NumberValueObject(
			Number(match[4] || 0) + weeks.value * 7
		);
		return { years, months, days };
	}

	toNumberOfDays(): NumberValueObject {
		const frequencyObject = this.toObject();
		if (!frequencyObject) return NumberValueObject.zero();
		return frequencyObject.years
			.times(new NumberValueObject(365))
			.plus(
				frequencyObject.months.times(
					ItemRecurrenceFrequency.MONTH_DAYS_RELATION
				)
			)
			.plus(frequencyObject.days);
	}

	static empty(): ItemRecurrenceFrequency {
		return new ItemRecurrenceFrequency("");
	}
}

export type FrequencyObject = {
	years: NumberValueObject;
	months: NumberValueObject;
	days: NumberValueObject;
};
