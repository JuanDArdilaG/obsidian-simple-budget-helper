import { BudgetItemNextDate } from "./BudgetItemNextDate";
import { FrequencyString } from "./FrequencyString";
import { BudgetItemRecord } from "./BudgetItemRecord";
import { dateStringToDate } from "utils/date";

export class BudgetItem {
	private _history: BudgetItemRecord[] = [];

	constructor(
		private _name: string,
		private _amount: number,
		private _category: string,
		private _type: "income" | "expense",
		private _nextDate: BudgetItemNextDate,
		private _frequency: FrequencyString,
		history?: BudgetItemRecord[]
	) {
		if (history) this._history = history;
	}

	get name(): string {
		return this._name;
	}

	get amount(): number {
		return this._amount;
	}

	get category(): string {
		return this._category;
	}

	get nextDate(): BudgetItemNextDate {
		return this._nextDate;
	}

	get history(): BudgetItemRecord[] {
		return this._history;
	}

	get remainingDays(): { str: string; color: string } {
		const rd = this.nextDate.remainingDays;
		const str = rd === 1 || rd === -1 ? `${rd} day` : `${rd} days`;
		const absRd = Math.abs(rd);
		return {
			str,
			color: rd < -7 ? "tomato" : absRd <= 7 ? "gold" : "greenyellow",
		};
	}

	get perMonthAmount(): number {
		const now = new Date();
		const nextDate = new Date(now.getTime());
		nextDate.setMonth(nextDate.getMonth() + 1);
		return this._ponderatedAmount(nextDate, now);
	}

	private _ponderatedAmount(date: Date, now: Date = new Date()): number {
		date.setHours(0, 0, 0, 0);
		now.setHours(0, 0, 0, 0);
		const daysToDate = Math.floor(
			(date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
		);
		if (daysToDate <= 0) return 0;
		const relationBetweenDateAndFrequency =
			daysToDate / this._frequency.toNumberOfDays();

		return this._amount * relationBetweenDateAndFrequency;
	}

	record(date: Date, amount?: number): void {
		this._nextDate = new BudgetItemNextDate(date);
		this._nextDate = this._nextDate.nextDate(this._frequency);

		if (amount) this._amount = amount;

		this._history.push(
			new BudgetItemRecord(this._name, this._type, date, this._amount)
		);

		console.log({ this: this });
	}

	toMarkdown(): string {
		console.log({ history: this._history });
		return `---
name: ${this._name}
amount: ${this._amount}
category: ${this._category}
type: ${this._type}
nextDate: ${this._nextDate.toISOString().split("T")[0]}
frequency: ${this._frequency}
---
# History
${this._history.map((r) => r.toString()).join("\n")}`;
	}

	static fromRawMarkdown(rawMarkdown: string): BudgetItem {
		const propertiesRegex =
			/name: (.*)\namount: (.*)\ncategory: (.*)\ntype: (.*)\nnextDate: (.*)\nfrequency: (.*)/;
		const match = propertiesRegex.exec(rawMarkdown);
		if (!match) throw new Error("Invalid raw markdown.");
		const historyStr = rawMarkdown.split("# History\n");
		let history = undefined;
		if (historyStr[1]) {
			history = historyStr[1].split("\n");
		}

		return new BudgetItem(
			match[1],
			parseInt(match[2]),
			match[3],
			match[4] as "expense" | "income",
			new BudgetItemNextDate(dateStringToDate(match[5])),
			new FrequencyString(match[6]),
			history
				?.filter((r) => !!r)
				.map((r) =>
					BudgetItemRecord.fromString(
						r,
						match[4] as "income" | "expense"
					)
				)
		);
	}
}
