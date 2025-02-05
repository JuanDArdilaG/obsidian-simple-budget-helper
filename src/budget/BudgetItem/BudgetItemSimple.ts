import { BudgetItemNextDate } from "./BudgetItemNextDate";
import {
	BudgetItemRecord,
	BudgetItemRecordType,
} from "./BugetItemRecord/BudgetItemRecord";
import { BudgetItem, TBudgetItem } from "./BudgetItem";
import { nanoid } from "nanoid";
import { BudgetItemRecordAmount } from "./BugetItemRecord/BudgetItemRecordAmount";

export class BudgetItemSimple extends BudgetItem {
	constructor(
		id: string,
		account: string,
		name: string,
		amount: number,
		category: string,
		type: BudgetItemRecordType,
		nextDate: BudgetItemNextDate,
		toAccount?: string
	) {
		super(id, name, amount, category, type, nextDate, account, toAccount);
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
		nextDate: Date,
		toAccount?: string
	): BudgetItemSimple {
		return new BudgetItemSimple(
			nanoid(),
			account,
			name,
			amount,
			category,
			type,
			new BudgetItemNextDate(nextDate, false),
			toAccount
		);
	}

	static copyFrom(item: BudgetItem): BudgetItemSimple {
		return new BudgetItemSimple(
			item.id,
			this.IsSimple(item) ? item.account : "",
			item.name,
			item.amount.toNumber(),
			item.category,
			item.type,
			item.nextDate,
			item.toAccount
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
				new Date(this.nextDate.getTime()),
				new BudgetItemRecordAmount(this.amount.toNumber())
			),
		];
	}

	get folderPath(): string {
		return "Simple";
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
		type: BudgetItemRecordType,
		amount: number,
		category: string,
		toAccount?: string
	) {
		this._name = name;
		this._account = account;
		this._nextDate = new BudgetItemNextDate(date, false);
		this._type = type;
		this._amount = amount;
		this._category = category;
		this._toAccount = toAccount;
	}

	removeHistoryRecord(_: string) {
		return;
	}

	toJSON(): TBudgetItem {
		return {
			id: this._id,
			account: this._account,
			name: this._name,
			amount: this._amount,
			category: this._category,
			type: this._type,
			nextDate: this._nextDate,
			toAccount: this._toAccount,
			path: this.folderPath,
			history: this.history.toString(),
			frequency: "",
		};
	}

	static fromJSON(json: TBudgetItem): BudgetItemSimple {
		return new BudgetItemSimple(
			json.id,
			json.account,
			json.name,
			json.amount,
			json.category,
			json.type,
			new BudgetItemNextDate(json.nextDate, false),
			json.toAccount
		);
	}

	static empty(): BudgetItemSimple {
		return new BudgetItemSimple(
			"",
			"",
			"",
			0,
			"",
			"expense",
			BudgetItemNextDate.empty()
		);
	}
}

export type TBudgetItemSimple = {
	id: string;
	account: string;
	name: string;
	amount: number;
	category: string;
	type: BudgetItemRecordType;
	nextDate: Date;
	toAccount?: string;
};
