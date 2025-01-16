import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";

export class BudgetItemRecord {
	constructor(
		private _id: number,
		private _itemID: number,
		private _name: string,
		private _type: "income" | "expense",
		private _date: Date,
		private _amount: number
	) {}

	get id(): number {
		return this._id;
	}

	get itemID(): number {
		return this._itemID;
	}

	get name(): string {
		return this._name;
	}

	get type(): "income" | "expense" {
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
		date: Date,
		type: "income" | "expense",
		amount: number
	) {
		this._name = name;
		this._date = date;
		this._type = type;
		this._amount = amount;
	}

	static fromString(
		id: number,
		itemID: number,
		str: string,
		type: "expense" | "income"
	): BudgetItemRecord {
		const match = /name: (.*)\. date: (.*)\. amount: (.*)/.exec(str);
		if (!match) throw new Error("Invalid raw markdown.");
		return new BudgetItemRecord(
			id,
			itemID,
			match[1],
			type,
			new Date(match[2]),
			PriceValueObject.fromString(match[3]).valueOf()
		);
	}

	toString(): string {
		return `- name: ${this._name}. date: ${
			this._date.toString().split(" GMT")[0]
		}. amount: ${new PriceValueObject(this._amount)}`;
	}
}
