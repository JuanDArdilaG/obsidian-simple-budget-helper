import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";

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
		private _amount: number
	) {}

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

	get amount(): number {
		return this._amount;
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
		this._amount = amount;
	}

	static fromString(
		itemID: string,
		str: string,
		type: BudgetItemRecordType,
		toAccount?: string
	): BudgetItemRecord {
		const match =
			/id: (.*)\. name: (.*)\. account: (.*)\. date: (.*)\. amount: (.*)/.exec(
				str
			);
		if (!match) throw new Error("Invalid raw markdown.");
		return new BudgetItemRecord(
			match[1],
			itemID,
			match[3],
			toAccount || "",
			match[2],
			type,
			new Date(match[4]),
			PriceValueObject.fromString(match[5]).valueOf()
		);
	}

	toString(): string {
		return `- id: ${this._id}. name: ${this._name}. account: ${
			this._account
		}. date: ${
			this._date.toString().split(" GMT")[0]
		}. amount: ${new PriceValueObject(this._amount)}`;
	}
}
