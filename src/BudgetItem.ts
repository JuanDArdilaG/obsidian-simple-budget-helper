import { DATE_RELATIONS } from "./constants";
import { FrequencyString } from "./FrequencyString";

export class BudgetItem {
	constructor(
		private _name: string,
		private _amount: number,
		private _category: string,
		private _nextDate: Date,
		private _frequency: FrequencyString
	) {}

	get name(): string {
		return this._name;
	}

	get amount(): number {
		return this._amount;
	}

	get category(): string {
		return this._category;
	}

	get perMonthAmount(): number {
		const now = new Date();
		const millisecondsToAdd =
			DATE_RELATIONS.MONTH_DAYS * 24 * 60 * 60 * 1000;
		const nextDate = new Date(now.getTime() + millisecondsToAdd);
		return this._ponderatedAmount(nextDate, now);
	}

	getAmountToDate(date: Date, now: Date = new Date()): number {
		return this._ponderatedAmount(date, now);
	}

	private _ponderatedAmount(date: Date, now: Date = new Date()): number {
		date.setHours(0, 0, 0, 0);
		now.setHours(0, 0, 0, 0);
		const daysToDate = Math.floor(
			(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);
		if (daysToDate <= 0) return 0;
		const frequencyDays = this._frequency.toDaysNumber();
		const relationBetweenDateAndFrequency = daysToDate / frequencyDays;

		return this._amount * relationBetweenDateAndFrequency;
	}

	toMarkdown(): string {
		return `---
name: ${this._name}
amount: ${this._amount}
category: ${this._category}
nextDate: ${this._nextDate}
frequency: ${this._frequency}
---`;
	}

	static fromRawMarkdown(rawMarkdown: string): BudgetItem {
		const regex =
			/name: (.*)\namount: (.*)\ncategory: (.*)\nnextDate: (.*)\nfrequency: (.*)/;
		const match = regex.exec(rawMarkdown);
		if (!match) throw new Error("Invalid raw markdown");

		return new BudgetItem(
			match[1],
			parseInt(match[2]),
			match[3],
			new Date(match[4]),
			new FrequencyString(match[5])
		);
	}
}
