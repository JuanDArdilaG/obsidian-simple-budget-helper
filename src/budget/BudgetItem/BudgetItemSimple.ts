import { BudgetItemNextDate } from "./BudgetItemNextDate";
import { BudgetItemRecord, BudgetItemRecordType } from "./BudgetItemRecord";
import { BudgetItem } from "./BudgetItem";
import { nanoid } from "nanoid";

export class BudgetItemSimple extends BudgetItem {
	constructor(
		id: string,
		private _account: string,
		name: string,
		amount: number,
		category: string,
		type: BudgetItemRecordType,
		nextDate: BudgetItemNextDate,
		toAccount?: string
	) {
		super(id, name, amount, category, type, nextDate, toAccount);
	}

	get account(): string {
		return this._account;
	}

	static create(
		account: string,
		name: string,
		amount: number,
		category: string,
		type: BudgetItemRecordType,
		nextDate: BudgetItemNextDate,
		toAccount?: string
	): BudgetItemSimple {
		return new BudgetItemSimple(
			nanoid(),
			account,
			name,
			amount,
			category,
			type,
			nextDate,
			toAccount
		);
	}

	static IsSimple(item: BudgetItem): item is BudgetItemSimple {
		return item instanceof BudgetItemSimple;
	}

	get history(): BudgetItemRecord[] {
		return [
			new BudgetItemRecord(
				this._id.toString(),
				this._id,
				this._account,
				this._toAccount || "",
				this.name,
				this._type,
				this.nextDate,
				this.amount
			),
		];
	}

	get folderPath(): string {
		return "Simple";
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

	record(date: Date, account: string, amount?: number): void {
		const nextDate = new BudgetItemNextDate(new Date(date));
		this._account = account;
		this._nextDate = nextDate;
		if (amount) this._amount = amount;
	}

	updateHistoryRecord(
		_: string,
		name: string,
		account: string,
		date: Date,
		type: "income" | "expense",
		amount: number,
		category: string
	) {
		console.log("updating");
		this._name = name;
		this._account = account;
		this._nextDate = new BudgetItemNextDate(date, false);
		this._type = type;
		this._amount = amount;
		this._category = category;
	}

	removeHistoryRecord(id: string) {
		return;
	}
}
