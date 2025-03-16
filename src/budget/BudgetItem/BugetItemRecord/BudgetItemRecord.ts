import { BudgetItemRecordAmount } from "./BudgetItemRecordAmount";

export type BudgetItemRecordType = "income" | "expense" | "transfer";

export class BudgetItemRecord {
	constructor(
		private _id: string,
		private _itemID: string,
		private _account: string,
		private _toAccount: string,
		private _name: string,
		private _type: BudgetItemRecordType,
		private _date: Date,
		private _amount: BudgetItemRecordAmount,
		private _brand?: string,
		private _store?: string
	) {}

	static fromString(
		itemID: string,
		str: string,
		type: BudgetItemRecordType,
		toAccount?: string
	): BudgetItemRecord {
		const match =
			/id: (.*)\. name: (.*)\. account: (.*)\. date: (.*)\. amount: (.*)(?:\. brand: (.*)\.(?: store: (.*)))?/.exec(
				str
			);
		console.log({ match });
		if (!match) throw new Error("Invalid raw markdown.");
		const [, id, name, account, date, amount, brand, store] = match;
		console.log({ id, name, account, date, amount, brand, store });
		return new BudgetItemRecord(
			id,
			itemID,
			account,
			toAccount || "",
			name,
			type,
			new Date(date),
			BudgetItemRecordAmount.fromString(amount),
			brand,
			store
		);
	}

	static create(item: TBudgetItemRecord): BudgetItemRecord {
		return new BudgetItemRecord(
			item.id,
			item.item,
			item.account,
			item.toAccount || "",
			item.name,
			item.type,
			item.date,
			new BudgetItemRecordAmount(item.amount),
			item.brand,
			item.store
		);
	}

	get id(): string {
		return this._id;
	}

	get itemID(): string {
		return this._itemID;
	}

	get name(): string {
		return this._name;
	}

	get account(): string {
		return this._account;
	}

	get toAccount(): string {
		return this._toAccount;
	}

	get type(): BudgetItemRecordType {
		return this._type;
	}

	get date(): Date {
		return this._date;
	}

	get amount(): BudgetItemRecordAmount {
		return this._amount;
	}

	get realAmount(): BudgetItemRecordAmount {
		return new BudgetItemRecordAmount(
			this.amount.toNumber() *
				(this.type === "expense" ? -1 : this.type === "income" ? 1 : 0)
		);
	}

	update(
		name: string,
		account: string,
		date: Date,
		type: "income" | "expense",
		amount: number
	) {
		this._name = name;
		this._account = account;
		this._date = date;
		this._type = type;
		this._amount = new BudgetItemRecordAmount(amount);
	}

	toString(): string {
		return `- id: ${this._id}. name: ${this._name}. account: ${
			this._account
		}. date: ${
			this._date.toString().split(" GMT")[0]
		}. amount: ${this._amount.toString()}${
			this._brand ? `. brand: ${this._brand}` : ""
		}${this._store ? `. store: ${this._store}` : ""}`;
	}

	validate(): { [K in keyof TBudgetItemRecord]: boolean } {
		return {
			id: true,
			item: this._itemID.length > 0,
			name: this._name.length > 0,
			account: this._account.length > 0,
			date: this._date.toString() !== "Invalid Date",
			amount: this._amount.toNumber() > 0,
			type: true,
			toAccount: this._type !== "transfer" || !!this._toAccount?.length,
		};
	}
}

export type TBudgetItemRecord = {
	id: string;
	item: string;
	name: string;
	account: string;
	toAccount?: string;
	type: BudgetItemRecordType;
	date: Date;
	amount: number;
	brand?: string;
	store?: string;
};
