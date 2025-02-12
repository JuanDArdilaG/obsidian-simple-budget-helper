import { BudgetItem } from "budget/BudgetItem/BudgetItem";
import { Budget } from "./Budget";
import {
	BudgetItemRecord,
	BudgetItemRecordType,
} from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { monthIndexToAbbr } from "utils/date";
import { Logger } from "utils/logger";

type HistoryConfig = {
	sinceDate?: Date;
	untilDate?: Date;
	untilID?: string;
	dropLast?: boolean;
	type?: BudgetItemRecordType;
	account?: string;
};

export type GroupByYearMonthDay = {
	[year: number]: {
		[month: string]: {
			[day: number]: BudgetItemRecord[];
		};
	};
};

export class BudgetHistory {
	constructor(private _history: BudgetItemRecord[]) {
		const ids = this._history.map((item) => item.id);
		if (ids.length !== new Set(ids).size) {
			throw new Error("Duplicate id found in history.");
		}
	}

	static fromBudget(
		budget: Budget<BudgetItem>,
		account?: string,
		category?: string
	): BudgetHistory {
		let history = new BudgetHistory(
			budget.items
				.map((item) => item.history)
				.flat()
				.sort((a, b) => {
					return a.date.getTime() - b.date.getTime();
				})
		);

		if (account)
			history = new BudgetHistory(history.filterByAccount(account));

		if (category)
			history = new BudgetHistory(
				history.filterByCategory(budget, category)
			);

		return history;
	}

	get history(): BudgetItemRecord[] {
		return this._history;
	}

	static fromGroupByYearMonthDay(groupedByYearMonthDay: GroupByYearMonthDay) {
		return new BudgetHistory(
			(
				Object.values(
					Object.values(groupedByYearMonthDay) as object[]
				) as BudgetItemRecord[]
			)
				.flat()
				.flat()
		);
	}

	getGroupedByYearMonthDay(config?: HistoryConfig): GroupByYearMonthDay {
		return this._history.reduce((grouped, record) => {
			const year = record.date.getFullYear();
			const month = monthIndexToAbbr(record.date.getMonth());

			if (
				!config?.account ||
				record.account === config.account ||
				record.toAccount === config.account
			) {
				if (!grouped[year]) grouped[year] = {};
				if (!grouped[year][month]) grouped[year][month] = {};
				if (!grouped[year][month][record.date.getDate()])
					grouped[year][month][record.date.getDate()] = [];
				grouped[year][month][record.date.getDate()].push(record);
			}

			return grouped;
		}, {} as GroupByYearMonthDay);
	}

	static groupByCategory(
		budget: Budget<BudgetItem>,
		byYearMonth: {
			[day: number]: BudgetItemRecord[];
		}
	): Record<string, BudgetHistory> {
		const result: Record<string, BudgetHistory> = {};
		for (const day of Object.keys(byYearMonth)) {
			byYearMonth[Number(day)].forEach((record) => {
				const item = budget.getItemByID(record.itemID);
				if (!item) return;
				if (!result[item.category]) {
					result[item.category] = new BudgetHistory([]);
				}
				result[item.category].history.push(record);
			});
		}
		return result;
	}

	onlyExpense(): BudgetHistory {
		return new BudgetHistory(
			this._history.filter((item) => item.type === "expense")
		);
	}

	onlyIncome(): BudgetHistory {
		return new BudgetHistory(
			this._history.filter((item) => item.type === "income")
		);
	}

	getAccounts(): string[] {
		const accounts: string[] = [];
		for (const record of this._history) {
			if (!accounts.includes(record.account)) {
				accounts.push(record.account);
			}
			if (record.toAccount && !accounts.includes(record.toAccount)) {
				accounts.push(record.toAccount);
			}
		}
		return accounts;
	}

	getBalance(config?: HistoryConfig): number {
		return this._getTotalHistory(config);
	}

	getAllByAccount(): Record<string, BudgetHistory> {
		const accounts = this.getAccounts();
		const result: Record<string, BudgetHistory> = {};

		for (const account of accounts) {
			result[account] = new BudgetHistory(this.filterByAccount(account));
		}
		return result;
	}

	filterByAccount(account: string): BudgetItemRecord[] {
		return this.history.filter(
			(item) => item.account === account || item.toAccount === account
		);
	}

	filterByCategory(
		budget: Budget<BudgetItem>,
		category: string
	): BudgetItemRecord[] {
		return this.history.filter((record) => {
			const item = budget.getItemByID(record.itemID);
			Logger.debug("filtering by category", {
				record,
				item,
				itemCategory: item?.category,
				category,
			});
			if (!item) return false;
			return item.category === category;
		});
	}

	private _getTotalHistory(config?: HistoryConfig): number {
		const untilIDIndex = config?.untilID
			? this._history.findIndex((item) => item.id === config?.untilID)
			: -1;
		const untilID =
			untilIDIndex !== -1 ? untilIDIndex : this.history.length - 1;
		return this.history
			.slice(0, config?.dropLast ? untilID : untilID + 1)
			.filter((item) => !config?.type || item.type === config.type)
			.filter(
				(item) =>
					!config?.account ||
					item.account === config.account ||
					item.toAccount === config.account
			)
			.filter(
				(item) => !config?.sinceDate || item.date >= config.sinceDate
			)
			.filter(
				(item) => !config?.untilDate || item.date <= config.untilDate
			)
			.reduce((total, item) => {
				return (
					total +
					item.amount.toNumber() *
						(item.type === "expense"
							? -1
							: item.type === "income"
							? 1
							: config?.account && item.account === config.account
							? -1
							: config?.account &&
							  item.toAccount === config.account
							? 1
							: 0)
				);
			}, 0);
	}
}
