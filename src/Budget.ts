import { BudgetItem } from "./BudgetItem";

export class Budget {
	constructor(private _items: BudgetItem[]) {}

	getTotalToDate(date: Date, now: Date = new Date()): number {
		return this._items.reduce((total, item) => {
			return total + item.getAmountToDate(date, now);
		}, 0);
	}
}
