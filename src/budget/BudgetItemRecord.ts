import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";

export class BudgetItemRecord {
	constructor(private _date: Date, private _amount: number) {}

	static fromString(str: string): BudgetItemRecord {
		const date = new Date(str.split("date: ")[1].split(".")[0]);
		const amount = Number(
			PriceValueObject.fromString(str.split("amount: ")[1]).valueOf()
		);
		return new BudgetItemRecord(date, amount);
	}

	toString(): string {
		return `- date: ${new Date(
			this._date
		).toISOString()}. amount: ${new PriceValueObject(this._amount)}`;
	}
}
