import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetItem } from "../BudgetItem/BudgetItem";
import { TFile, Vault } from "obsidian";
import { BudgetItemNextDate } from "../BudgetItem/BudgetItemNextDate";
import { BudgetItemRecurrentMDFormatter } from "budget/BudgetItem/BudgetItemMDFormatter";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { BudgetHistory } from "./BudgetHistory";
import { BudgetItemRecordType } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";

export class Budget<T extends BudgetItem> {
	constructor(private _items: T[]) {}

	get items(): T[] {
		return this._items;
	}

	getNames(): string[] {
		const names: string[] = [];
		for (const item of this._items) {
			if (!names.includes(item.name)) {
				names.push(item.name);
			}
		}
		return names;
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

	getAccounts(): string[] {
		return BudgetHistory.fromBudget(this, 0).getAccounts();
	}

	addItems(...items: T[]) {
		this._items = [...this._items, ...items];
	}

	getItemByID(id: string): T | undefined {
		return this._items.find((item) => item.id === id);
	}

	removeItemByID(id: string) {
		console.log({ id, before: [...this._items] });
		this._items = this._items.filter((item) => item.id !== id);
		console.log({ after: [...this._items] });
	}

	updateItemByID(id: string, item: T) {
		console.log({ id, before: [...this._items] });
		this._items = this._items.map((i) => (i.id === id ? item : i));
		console.log({ after: [...this._items] });
	}

	getTotalPerMonth(): number {
		return this.onlyRecurrent().items.reduce((total, item) => {
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

	orderByNextDate(order: "desc" | "asc" = "asc"): Budget<T> {
		return new Budget(
			this._items.sort((a, b) =>
				order === "asc"
					? a.nextDate.getTime() - b.nextDate.getTime()
					: b.nextDate.getTime() - a.nextDate.getTime()
			)
		);
	}

	getNDaysItems(n: number): { item: BudgetItemRecurrent; dates: Date[] }[] {
		const items: { item: BudgetItemRecurrent; dates: Date[] }[] = [];
		this.onlyRecurrent().items.forEach((item) => {
			const a = item.getRecurrenceDatesForNDays(n);
			if (a.length > 0) {
				items.push({ item, dates: a });
			}
		});

		return items;
	}

	onlyRecurrent(): Budget<BudgetItemRecurrent> {
		const items = this._items.filter(
			BudgetItemRecurrent.IsRecurrent
		) as unknown as BudgetItemRecurrent[];
		return new Budget<BudgetItemRecurrent>(items);
	}

	onlySimple(): Budget<BudgetItemSimple> {
		const items: BudgetItemSimple[] = this._items.filter(
			BudgetItemSimple.IsSimple
		) as unknown as BudgetItemSimple[];
		return new Budget<BudgetItemSimple>(items);
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
		const simpleItems: BudgetItemSimple[] = this.orderByNextDate(
			"desc"
		).items.filter(
			BudgetItemSimple.IsSimple
		) as unknown as BudgetItemSimple[];

		const headers =
			"| ID | Name | Type | Category | Account | Date | Amount |\n|------|---------|------|--------|\n";

		if (simpleItems.length === 0) {
			return headers + "| | | | | | | |";
		}

		return (
			headers +
			simpleItems
				.map((item) => {
					return `| ${item.id} | ${item.name} | ${item.type} | ${
						item.category
					} | ${
						item.type !== "transfer"
							? item.account
							: `${item.account} - ${item.toAccount}`
					} | ${
						item.nextDate.toString().split(" GMT")[0]
					} | ${new PriceValueObject(item.amount).toString()} |`;
				})
				.join("\n")
		);
	}

	static async fromFiles(
		fileReader: (file: TFile) => Promise<string>,
		files: TFile[],
		budget: Budget<BudgetItemRecurrent> = new Budget<BudgetItemRecurrent>(
			[]
		)
	): Promise<Budget<BudgetItemRecurrent>> {
		for (const file of files) {
			const fileContent = await fileReader(file);
			const budgetItem = BudgetItemRecurrentMDFormatter.fromRawMarkdown(
				file.path,
				fileContent
			);
			budget.addItems(budgetItem);
		}

		return budget;
	}

	static async loadSimpleTransactions(
		vault: Vault,
		rootFolder: string
	): Promise<Budget<BudgetItemSimple>> {
		const budget = new Budget<BudgetItemSimple>([]);

		const file = vault.getFileByPath(`${rootFolder}/Simple.md`);
		if (file) {
			const fileContent = await vault.cachedRead(file);
			budget.addItems(
				...Budget.fromSimpleTransactionsTableMarkdown(fileContent).items
			);
		}

		return budget;
	}

	static fromSimpleTransactionsTableMarkdown(
		markdown: string
	): Budget<BudgetItemSimple> {
		const lines = markdown.split("\n").filter((line) => !!line);
		const budget = new Budget<BudgetItemSimple>([]);
		for (let i = 2; i < lines.length; i++) {
			const line = lines[i].split("|");
			const type = line[3].trim() as BudgetItemRecordType;
			const account =
				type === "transfer"
					? line[5].trim().split(" - ")[0]
					: line[5].trim();
			const toAccount =
				type === "transfer"
					? line[5].trim().split(" - ")[1]
					: undefined;
			budget.addItems(
				new BudgetItemSimple(
					line[1].trim(),
					account,
					line[2].trim(),
					PriceValueObject.fromString(line[7].trim()).valueOf(),
					line[4].trim(),
					type,
					new BudgetItemNextDate(new Date(line[6].trim()), false),
					toAccount
				)
			);
		}
		return budget;
	}
}
