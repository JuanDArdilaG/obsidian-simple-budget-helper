import { BudgetItem } from "./BudgetItem";

export class Budget {
	constructor(private _items: BudgetItem[]) {}

	get items(): BudgetItem[] {
		return this._items;
	}

	get categories(): string[] {
		const categories: string[] = [];
		for (const item of this._items) {
			if (!categories.includes(item.category)) {
				categories.push(item.category);
			}
		}
		return categories;
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

	getTotal(): number {
		return this._items.reduce((total, item) => {
			return total + item.amount;
		}, 0);
	}

	getItemsOrderedByNextDate(): BudgetItem[] {
		return this._items.sort((a, b) => {
			return a.nextDate.getTime() - b.nextDate.getTime();
		});
	}
}
