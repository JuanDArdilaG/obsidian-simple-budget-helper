import { DATE_RELATIONS } from "./constants";

export class BudgetItem {
	constructor(
		private _name: string,
		private _amount: number,
		private _category: string,
		private _nextDate: Date,
		private _frequency: string
	) {}

	get name(): string {
		return this._name;
	}

	get amount(): number {
		return this._amount;
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
		const frequencyDays = this._frequencyToDays(this._frequency);
		const relationBetweenDateAndFrequency = daysToDate / frequencyDays;

		console.log({
			name: this._name,
			date,
			daysToDate,
			frequency: this._frequency,
			frequencyDays,
			relationBetweenDateAndFrequency,
		});

		return this._amount * relationBetweenDateAndFrequency;
	}

	private _frequencyToDays(frequency: string): number {
		const regex =
			/(?:(\d*)y)?(?:(\d*)mo)?(?:(\d*)w)?(?:(\d*)d)?(?:(\d*)h)?(?:(\d*)m)?(?:(\d*)s)?/;
		const match = regex.exec(frequency);
		if (!match) return 0;
		const years = Number(match[1] || 0) * 365;
		const months = Number(match[2] || 0) * 30;
		const weeks = Number(match[3] || 0) * 7;
		const days = Number(match[4] || 0);
		const hours = Number(match[5] || 0) * 24;
		const minutes = Number(match[6] || 0) * 60;
		const seconds = Number(match[7] || 0) * 60;
		return years + months + weeks + days + hours + minutes + seconds;
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
			match[5]
		);
	}
}
