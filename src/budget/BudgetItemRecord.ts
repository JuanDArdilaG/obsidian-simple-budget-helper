import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { dateStringToDate } from "utils/date";

export class BudgetItemRecord {
	constructor(
		private _name: string,
		private _type: "income" | "expense",
		private _date: Date,
		private _amount: number
	) {}

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

	static fromString(
		str: string,
		type: "expense" | "income"
	): BudgetItemRecord {
		const match = /name: (.*)\. date: (.*)\. amount: (.*)/.exec(str);
		if (!match) throw new Error("Invalid raw markdown");
		return new BudgetItemRecord(
			match[1],
			type,
			new Date(dateStringToDate(match[2])),
			PriceValueObject.fromString(match[3]).valueOf()
		);
	}

	toString(): string {
		return `- name: ${this._name}. date: ${
			new Date(this._date).toISOString().split("T")[0]
		}. amount: ${new PriceValueObject(this._amount)}`;
	}
}
