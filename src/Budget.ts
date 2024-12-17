import { BudgetItem } from "./BudgetItem";

export class Budget {
	constructor(private _items: BudgetItem[]) {}

	get items(): BudgetItem[] {
		return this._items;
	}

	addItem(item: BudgetItem) {
		this._items.push(item);
	}

	getTotalToDate(date: Date, now: Date = new Date()): number {
		return this._items.reduce((total, item) => {
			return total + item.getAmountToDate(date, now);
		}, 0);
	}

	getTotalPerMonth(): number {
		return this._items.reduce((total, item) => {
			return total + item.perMonthAmount;
		}, 0);
	}
}
