import { BudgetItemNextDate } from "./BudgetItemNextDate";
import {
	BudgetItemRecord,
	BudgetItemRecordType,
} from "./BugetItemRecord/BudgetItemRecord";

export abstract class BudgetItem {
	constructor(
		protected _id: string,
		protected _name: string,
		protected _amount: number,
		protected _category: string,
		protected _type: BudgetItemRecordType,
		protected _nextDate: BudgetItemNextDate,
		protected _toAccount?: string
	) {}

	get id(): string {
		return this._id;
	}

	get name(): string {
		return this._name;
	}

	get type(): BudgetItemRecordType {
		return this._type;
	}

	get toAccount(): string | undefined {
		return this._toAccount;
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

	abstract get history(): BudgetItemRecord[];

	abstract get folderPath(): string;

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

	abstract record(
		date: Date,
		account: string,
		amount?: number,
		isPermanent?: boolean
	): void;

	abstract updateHistoryRecord(
		id: string,
		name: string,
		account: string,
		date: Date,
		type: BudgetItemRecordType,
		amount: number,
		category: string
	): void;

	abstract removeHistoryRecord(id: string): void;
}
