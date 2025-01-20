import { BudgetItemNextDate } from "./BudgetItemNextDate";
import { FrequencyString } from "./FrequencyString";
import { BudgetItemRecord, BudgetItemRecordType } from "./BudgetItemRecord";
import { BudgetItem } from "./BudgetItem";
import { nanoid } from "nanoid";

export class BudgetItemRecurrent extends BudgetItem {
	constructor(
		id: string,
		name: string,
		amount: number,
		category: string,
		type: BudgetItemRecordType,
		nextDate: BudgetItemNextDate,
		path: string,
		private _frequency: FrequencyString,
		private _history: BudgetItemRecord[],
		toAccount?: string
	) {
		super(
			id,
			name,
			amount,
			category,
			type,
			nextDate,
			type === "transfer" ? toAccount : undefined,
			path
		);
	}

	get frequency(): FrequencyString {
		return this._frequency;
	}

	static create(
		name: string,
		amount: number,
		category: string,
		type: BudgetItemRecordType,
		nextDate: BudgetItemNextDate,
		frequency: FrequencyString,
		path: string,
		toAccount?: string
	): BudgetItemRecurrent {
		return new BudgetItemRecurrent(
			nanoid(),
			name,
			amount,
			category,
			type,
			nextDate,
			path,
			frequency,
			[],
			toAccount
		);
	}

	static IsRecurrent(item: BudgetItem): item is BudgetItemRecurrent {
		return item instanceof BudgetItemRecurrent;
	}

	get folderPath(): string {
		return "Recurrent";
	}

	get history(): BudgetItemRecord[] {
		return this._history || [];
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

	record(
		date: Date,
		account: string,
		amount?: number,
		isPermanent?: boolean
	): void {
		let nextDate = new BudgetItemNextDate(new Date(date));
		nextDate = this._nextDate.nextDate(this._frequency);
		const nextAmount = amount || this._amount;

		if (isPermanent) {
			this._nextDate = nextDate;
			if (amount) this._amount = amount;
		}
		this._history.push(
			new BudgetItemRecord(
				`${this._id}-${this._history.length}`,
				this._id,
				account,
				this.toAccount || "",
				this._name,
				this._type,
				date,
				nextAmount
			)
		);
	}

	updateHistoryRecord(
		id: string,
		name: string,
		account: string,
		date: Date,
		type: "income" | "expense",
		amount: number
	) {
		const record = this.history.find((r) => r.id === id);
		if (!record) return;
		record.update(name, account, date, type, amount);
	}

	removeHistoryRecord(id: string) {
		console.log({ before: [...this._history] });
		this._history = this._history.filter((r) => r.id !== id);
		console.log({ after: this._history });
	}
}
