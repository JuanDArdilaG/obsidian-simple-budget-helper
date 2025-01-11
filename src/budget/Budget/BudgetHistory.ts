import { Budget } from "./Budget";

type HistoryConfig = {
	since?: Date;
	until?: Date;
	type?: "expense" | "income";
};

export class BudgetHistory {
	constructor(private _budget: Budget, private _initialBalance: number) {}

	getBalance(config?: HistoryConfig): number {
		return this._initialBalance + this._getTotalHistory(config);
	}

	private _getTotalHistory(config?: HistoryConfig): number {
		return this._budget
			.getAllHistory()
			.filter((item) => !config?.type || item.type === config.type)
			.filter((item) => !config?.since || item.date >= config.since)
			.filter((item) => !config?.until || item.date <= config.until)
			.reduce((total, item) => {
				return total + item.amount * (item.type === "expense" ? -1 : 1);
			}, 0);
	}
}
