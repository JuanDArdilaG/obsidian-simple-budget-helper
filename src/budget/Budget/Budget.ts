import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetItem } from "../BudgetItem/BudgetItem";
import { BudgetItemRecord } from "../BudgetItem/BudgetItemRecord";
import { TFile, Vault } from "obsidian";
import { BudgetItemNextDate } from "../BudgetItem/BudgetItemNextDate";
import { BudgetItemMDFormatter } from "budget/BudgetItem/BudgetItemMDFormatter";

export class Budget {
	constructor(private _items: BudgetItem[]) {}

	get items(): BudgetItem[] {
		return this._items;
	}

	getCategories(): string[] {
		const categories: string[] = [];
		for (const item of this._items) {
			if (!categories.includes(item.category)) {
				categories.push(item.category);
			}
		}
		return categories;
	}

	addItems(...items: BudgetItem[]) {
		this._items = this._items.concat(items);
	}

	getItemByID(id: number): BudgetItem | undefined {
		return this._items.find((item) => item.id === id);
	}

	getNextID(): number {
		return this._items.sort((a, b) => b.id - a.id)[0].id + 1;
	}

	removeItemByID(id: number) {
		console.log({ id, before: [...this._items] });
		this._items = this._items.filter((item) => item.id !== id);
		console.log({ after: [...this._items] });
	}

	getTotalPerMonth(): number {
		return this._items.reduce((total, item) => {
			return total + item.perMonthAmount;
		}, 0);
	}

	getTotal(config?: { until?: Date }): number {
		return this._items
			.filter((item) => !config?.until || item.nextDate <= config.until)
			.reduce((total, item) => {
				return total + item.amount * (item.type === "expense" ? -1 : 1);
			}, 0);
	}

	orderByNextDate(order: "desc" | "asc" = "asc"): Budget {
		console.log({ items: this._items });
		return new Budget(
			this._items.sort((a, b) =>
				order === "asc"
					? a.nextDate.getTime() - b.nextDate.getTime()
					: b.nextDate.getTime() - a.nextDate.getTime()
			)
		);
	}

	getNDaysItems(n: number): BudgetItem[] {
		return this._items.filter((item) => {
			return item.nextDate.remainingDays <= n;
		});
	}

	getAllHistory(): BudgetItemRecord[] {
		return this._items.reduce((total, item) => {
			return total.concat(item.history);
		}, new Array<BudgetItemRecord>());
	}

	onlyRecurrent(): Budget {
		return new Budget(this._items.filter((item) => item.isRecurrent));
	}

	onlySimple(): Budget {
		return new Budget(this._items.filter((item) => !item.isRecurrent));
	}

	async saveSimpleTransactions(vault: Vault, rootFolder: string) {
		const file = vault.getFileByPath(`${rootFolder}/Simple.md`);
		if (!file)
			throw new Error(
				`Error retrieving simple transactions file. Path: ${rootFolder}/Simple.md`
			);
		await vault.modify(file, this.toSimpleTransactionsTableMarkdown());
	}

	toSimpleTransactionsTableMarkdown(): string {
		const transactions = this.orderByNextDate("desc").items.filter(
			(item) => !item.isRecurrent
		);

		const headers =
			"| Name | Type | Category | Date | Amount |\n|------|---------|------|--------|\n";

		if (transactions.length === 0) {
			return headers + "| | | | | |";
		}

		return (
			headers +
			transactions
				.map((item) => {
					return `| ${item.name} | ${item.type} | ${
						item.category
					} | ${
						item.nextDate.toString().split(" GMT")[0]
					} | ${new PriceValueObject(item.amount).toString()} |`;
				})
				.join("\n")
		);
	}

	static async fromFiles(
		fileReader: (file: TFile) => Promise<string>,
		files: TFile[]
	): Promise<Budget> {
		const budget = new Budget([]);

		let id = 0;
		for (const file of files) {
			const fileContent = await fileReader(file);
			const budgetItem = BudgetItemMDFormatter.fromRawMarkdown(
				id,
				file.path,
				fileContent
			);
			budget.addItems(budgetItem);
			id++;
		}

		return budget;
	}

	static async loadSimpleTransactions(
		initialID: number,
		vault: Vault,
		rootFolder: string
	): Promise<Budget> {
		const budget = new Budget([]);

		const file = vault.getFileByPath(`${rootFolder}/Simple.md`);
		if (file) {
			const fileContent = await vault.cachedRead(file);
			budget.addItems(
				...Budget.fromSimpleTransactionsTableMarkdown(
					initialID,
					fileContent
				).items
			);
		}

		return budget;
	}

	static fromSimpleTransactionsTableMarkdown(
		intialID: number,
		markdown: string
	): Budget {
		const lines = markdown.split("\n").filter((line) => !!line);
		const budget = new Budget([]);
		let id = intialID;
		for (let i = 2; i < lines.length; i++) {
			const line = lines[i].split("|");
			budget.addItems(
				BudgetItem.createSimple(
					id,
					line[1].trim(),
					PriceValueObject.fromString(line[5].trim()).valueOf(),
					line[3].trim(),
					line[2].trim() === "expense" ? "expense" : "income",
					new BudgetItemNextDate(new Date(line[4].trim()), false)
				)
			);
			id++;
		}
		return budget;
	}
}
