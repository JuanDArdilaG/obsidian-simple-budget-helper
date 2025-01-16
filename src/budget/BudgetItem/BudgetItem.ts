import { BudgetItemNextDate } from "./BudgetItemNextDate";
import { FrequencyString } from "./FrequencyString";
import { BudgetItemRecord } from "./BudgetItemRecord";

export class BudgetItem {
	constructor(
		private _id: number,
		private _name: string,
		private _amount: number,
		private _category: string,
		private _type: "income" | "expense",
		private _nextDate: BudgetItemNextDate,
		private _path?: string,
		private _frequency?: FrequencyString,
		private _history?: BudgetItemRecord[]
	) {}

	static createRecurrent(
		id: number,
		name: string,
		amount: number,
		category: string,
		type: "income" | "expense",
		nextDate: BudgetItemNextDate,
		frequency: FrequencyString,
		path: string
	): BudgetItem {
		return new BudgetItem(
			id,
			name,
			amount,
			category,
			type,
			nextDate,
			path,
			frequency,
			[]
		);
	}

	static createSimple(
		id: number,
		name: string,
		amount: number,
		category: string,
		type: "income" | "expense",
		nextDate: BudgetItemNextDate
	): BudgetItem {
		return new BudgetItem(id, name, amount, category, type, nextDate);
	}

	get id(): number {
		return this._id;
	}

	get name(): string {
		return this._name;
	}

	get type(): "income" | "expense" {
		return this._type;
	}

	get amount(): number {
		return this._amount;
	}

	set path(path: string | undefined) {
		this._path = path;
	}

	get path(): string | undefined {
		return this._path;
	}

	get frequency(): FrequencyString | undefined {
		return this._frequency;
	}

	get category(): string {
		return this._category;
	}

	get nextDate(): BudgetItemNextDate {
		return this._nextDate;
	}

	get isRecurrent(): boolean {
		return !!this._frequency;
	}

	get history(): BudgetItemRecord[] {
		return this._frequency
			? this._history || []
			: [
					new BudgetItemRecord(
						0,
						this._id,
						this.name,
						this._type,
						this.nextDate,
						this.amount
					),
			  ];
	}

	get folderPath(): string {
		return `${this._frequency ? "Recurrent" : "Simple"}`;
	}

	get filePath(): string {
		return `${this.folderPath}/${this._name}.md`;
	}

	get remainingDays(): { str: string; color: string } {
		const rd = this.nextDate.remainingDays;
		const str = rd === 1 || rd === -1 ? `${rd} day` : `${rd} days.`;
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
		if (!this._frequency) return this._amount;
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

	record(date: Date, amount?: number, isPermanent?: boolean): void {
		let nextDate = new BudgetItemNextDate(new Date(date));
		nextDate = this._frequency
			? this._nextDate.nextDate(this._frequency)
			: nextDate;
		const nextAmount = amount || this._amount;

		if (isPermanent) {
			this._nextDate = nextDate;
			if (amount) this._amount = amount;
		}

		if (this._history) {
			this._history.push(
				new BudgetItemRecord(
					this._history.length,
					this._id,
					this._name,
					this._type,
					date,
					nextAmount
				)
			);
		}
	}

	updateHistoryRecord(
		id: number,
		name: string,
		date: Date,
		type: "income" | "expense",
		amount: number
	) {
		console.log("updating");
		console.log({ isRecurrent: this.isRecurrent });
		if (this.isRecurrent) {
			const record = this.history.find((r) => r.id === id);
			if (!record) return;
			record.update(name, date, type, amount);
		} else {
			this._name = name;
			this._nextDate = new BudgetItemNextDate(date, false);
			this._type = type;
			this._amount = amount;
		}
	}

	removeHistoryRecord(id: number) {
		if (!this._history) return;
		console.log({ before: [...this._history] });
		this._history = this._history.filter((r) => r.id !== id);
		console.log({ after: this._history });
	}
}
