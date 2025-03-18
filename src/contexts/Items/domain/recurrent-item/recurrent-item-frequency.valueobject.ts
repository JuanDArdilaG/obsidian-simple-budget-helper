import { DATE_RELATIONS } from "apps/obsidian-plugin/config";
import { StringValueObject } from "contexts/Shared/domain/value-objects/string.valueobject";

export class RecurrrentItemFrequency extends StringValueObject {
	constructor(value: string) {
		super("Recurrent Item Frequency", value);
	}

	toObject(): FrequencyObject | undefined {
		const regex = /(?:(\d*)y)?(?:(\d*)mo)?(?:(\d*)w)?(?:(\d*)d)?/;
		const match = regex.exec(this.toString());
		if (!match) return undefined;
		const years = Number(match[1] || 0);
		const months = Number(match[2] || 0);
		const weeks = Number(match[3] || 0);
		const days = Number(match[4] || 0) + weeks * 7;
		return { years, months, days };
	}

	toNumberOfDays(): number {
		const frequencyObject = this.toObject();
		if (!frequencyObject) return 0;
		return (
			frequencyObject.years * 365 +
			frequencyObject.months * DATE_RELATIONS.MONTH_DAYS +
			frequencyObject.days
		);
	}

	static empty(): RecurrrentItemFrequency {
		return new RecurrrentItemFrequency("");
	}
}

export type FrequencyObject = {
	years: number;
	months: number;
	days: number;
};
