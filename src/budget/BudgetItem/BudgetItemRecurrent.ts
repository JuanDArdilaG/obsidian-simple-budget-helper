import { BudgetItemNextDate } from "./BudgetItemNextDate";
import { FrequencyString } from "./FrequencyString";
import {
	BudgetItemRecord,
	BudgetItemRecordType,
} from "./BugetItemRecord/BudgetItemRecord";
import { BudgetItem, TBudgetItem } from "./BudgetItem";
import { nanoid } from "nanoid";
import { BudgetItemRecordAmount } from "./BugetItemRecord/BudgetItemRecordAmount";
import { Logger } from "utils/logger";

export class BudgetItemRecurrent extends BudgetItem {
	constructor(
		id: string,
		name: string,
		account: string,
		amount: number,
		category: string,
		type: BudgetItemRecordType,
		nextDate: BudgetItemNextDate,
		private _path: string,
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
			account,
			type === "transfer" ? toAccount : undefined
		);
	}

	get frequency(): FrequencyString {
		return this._frequency;
	}

	get path(): string {
		return this._path;
	}

	static create(
		name: string,
		account: string,
		amount: number,
		category: string,
		type: BudgetItemRecordType,
		nextDate: Date,
		frequency: FrequencyString,
		path: string,
		toAccount?: string
	): BudgetItemRecurrent {
		return new BudgetItemRecurrent(
			nanoid(),
			name,
			account,
			amount,
			category,
			type,
			new BudgetItemNextDate(nextDate, true),
			path,
			frequency,
			[],
			toAccount
		);
	}

	static IsRecurrent(item: BudgetItem): item is BudgetItemRecurrent {
		return item instanceof BudgetItemRecurrent;
	}

	get filePath(): string {
		return this._path;
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

	getRecurrenceDatesForNDays(days: number): Date[] {
		const now = new Date();
		now.setHours(0, 0, 0, 0);

		const finalDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
		let initialDate = this.nextDate;
		const dates = [];
		while (initialDate.getTime() <= finalDate.getTime()) {
			dates.push(new Date(initialDate.getTime()));
			initialDate = initialDate.nextDate(this._frequency);
		}
		return dates;
	}

	record(
		date: Date,
		account: string,
		amount?: number,
		isPermanent?: boolean
	): void {
		let recordDate = new BudgetItemNextDate(date);
		const nextAmount = amount || this._amount;
		const nextDate = this._nextDate.nextDate(this._frequency);

		Logger.debug("calculating next date", {
			frequency: this._frequency,
			prev: this._nextDate,
			next: nextDate,
		});

		Logger.debug("checking permanent changes", {
			isPermanent,
			amount: {
				change: !!amount,
				from: this._amount,
				to: amount,
			},
			recordDate: {
				change: recordDate.compare(this._nextDate, true) !== 0,
				from: this._nextDate,
				to: recordDate.nextDate(this._frequency),
			},
		});

		if (isPermanent) {
			if (amount) this._amount = amount;
			if (recordDate.compare(this._nextDate, true) !== 0) {
				this._nextDate = recordDate.nextDate(this._frequency);
			}
		} else {
			this._nextDate = nextDate;
		}

		this._history.push(
			new BudgetItemRecord(
				nanoid(),
				this._id,
				account,
				this.toAccount || "",
				this._name,
				this._type,
				date,
				new BudgetItemRecordAmount(nextAmount)
			)
		);
	}

	validate(): { [K in keyof TBudgetItem]: boolean } {
		return {
			id: true,
			name: this._name.length > 0,
			account: this._account.length > 0,
			amount: this._amount > 0,
			nextDate: this._nextDate.toString() !== "Invalid Date",
			category: this._category.length > 0,
			toAccount: this._type !== "transfer" || !!this._toAccount?.length,
			frequency: true,
			path: true,
			history: true,
			type: true,
		};
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

	toJSON(): TBudgetItem {
		return {
			id: this._id,
			name: this._name,
			amount: this._amount,
			account: this._account,
			category: this._category,
			type: this._type,
			nextDate: this._nextDate.toDate(),
			toAccount: this._toAccount,
			path: this._path,
			frequency: this._frequency.toString(),
			history: this._history.toString(),
		};
	}

	static fromJSON(json: TBudgetItem): BudgetItemRecurrent {
		return new BudgetItemRecurrent(
			json.id,
			json.name,
			json.account,
			json.amount,
			json.category,
			json.type as BudgetItemRecordType,
			new BudgetItemNextDate(json.nextDate),
			json.path,
			new FrequencyString(json.frequency),
			[],
			json.toAccount
		);
	}

	static empty(): BudgetItemRecurrent {
		return new BudgetItemRecurrent(
			"",
			"",
			"",
			0,
			"",
			"expense",
			BudgetItemNextDate.empty(),
			"",
			FrequencyString.empty(),
			[]
		);
	}
}

export type TBudgetItemRecurrent = {
	id: string;
	name: string;
	amount: number;
	account: string;
	category: string;
	type: BudgetItemRecordType;
	nextDate: Date;
	toAccount?: string;
	path: string;
	frequency: string;
	history: string;
};
