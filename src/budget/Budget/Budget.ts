import { PriceValueObject } from "@juandardilag/value-objects/PriceValueObject";
import { BudgetItem } from "../BudgetItem/BudgetItem";
import { TFile, Vault } from "obsidian";
import { BudgetItemNextDate } from "../BudgetItem/BudgetItemNextDate";
import { BudgetItemRecurrentMDFormatter } from "budget/BudgetItem/BudgetItemMDFormatter";
import { BudgetItemSimple } from "budget/BudgetItem/BudgetItemSimple";
import { BudgetItemRecurrent } from "budget/BudgetItem/BudgetItemRecurrent";
import { BudgetHistory } from "./BudgetHistory";
import { BudgetItemRecordType } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";

type SortConfig = { order?: "asc" | "desc" };

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

	getCategories(config?: SortConfig): string[] {
		const categories: string[] = [];
		for (const item of this._items) {
			if (!categories.includes(item.category)) {
				categories.push(item.category);
			}
		}

		if (config?.order === "asc") {
			return categories.sort((a, b) => a.localeCompare(b));
		} else if (config?.order === "desc") {
			return categories.sort((a, b) => b.localeCompare(a));
		}
		return categories;
	}

	getSubCategories(config?: {
		category?: string;
		sort?: SortConfig;
	}): string[] {
		const subCategories: string[] = [];
		for (const item of this._items) {
			if (
				(!config?.category || item.category === config.category) &&
				!subCategories.includes(item.subCategory)
			) {
				subCategories.push(item.subCategory);
			}
		}

		if (config?.sort?.order === "asc") {
			return subCategories.sort((a, b) => a.localeCompare(b));
		} else if (config?.sort?.order === "desc") {
			return subCategories.sort((a, b) => b.localeCompare(a));
		}
		return subCategories;
	}

	getAccounts(config?: SortConfig): string[] {
		const accounts: string[] = [];
		for (const item of this._items) {
			if (!accounts.includes(item.account)) {
				accounts.push(item.account);
			}
		}

		if (config?.order === "asc") {
			return accounts.sort((a, b) => a.localeCompare(b));
		} else if (config?.order === "desc") {
			return accounts.sort((a, b) => b.localeCompare(a));
		}
		return accounts;
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
				return (
					total +
					item.amount.toNumber() * (item.type === "expense" ? -1 : 1)
				);
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

	getHistory(): BudgetHistory {
		return new BudgetHistory(this.items.map((item) => item.history).flat());
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
			"| ID | Name | Type | Category | SubCategory | Account | Date | Amount |\n|------|---------|------|--------|\n";

		if (simpleItems.length === 0) {
			return headers + "| | | | | | | |";
		}

		return (
			headers +
			simpleItems
				.map((item) => {
					return `| ${item.id} | ${item.name} | ${item.type} | ${
						item.category
					} | ${item.subCategory} | ${
						item.type !== "transfer"
							? item.account
							: `${item.account} - ${item.toAccount}`
					} | ${
						item.nextDate.toString().split(" GMT")[0]
					} | ${item.amount.toString()} |`;
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
			let [
				,
				id,
				name,
				type,
				category,
				subCategory,
				account,
				date,
				amount,
			] = lines[i].split("|").map((item) => item.trim());

			budget.addItems(
				new BudgetItemSimple(
					id,
					type === "transfer" ? account.split(" - ")[0] : account,
					name,
					PriceValueObject.fromString(amount).valueOf(),
					category,
					subCategory || "To Assign",
					type as BudgetItemRecordType,
					new BudgetItemNextDate(new Date(date)),
					type === "transfer" ? account.split(" - ")[1] : undefined
				)
			);
		}
		return budget;
	}
}
