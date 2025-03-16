import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { BudgetItemRecord } from "budget/BudgetItem/BugetItemRecord/BudgetItemRecord";
import { FrequencyString } from "budget/BudgetItem/FrequencyString";
import { BudgetItemRecurrent } from "./BudgetItemRecurrent";

export class BudgetItemRecurrentMDFormatter {
	constructor(private _item: BudgetItemRecurrent) {}

	static fromRawMarkdown(
		path: string,
		rawMarkdown: string
	): BudgetItemRecurrent {
		const propertiesRegex =
			/id: (.*)\nname: (.*)\namount: (.*)\ncategory: (.*)\nsubCategory:(.*)\nbrand:(.*)\nstore:(.*)\ntype: (.*)\nnextDate: (.*)\nfrequency: (.*)\naccount: (.*)(?:\nto account: (.*))?/;
		const match = propertiesRegex.exec(rawMarkdown);
		if (!match) throw new Error("Invalid raw markdown.");
		const [
			,
			id,
			name,
			amount,
			category,
			subCategory,
			brand,
			store,
			type,
			nextDate,
			frequency,
			account,
			toAccount,
		] = match;

		const historyStr = rawMarkdown.split("# History\n");
		let history = undefined;
		if (historyStr[1]) history = historyStr[1].split("\n");

		return new BudgetItemRecurrent(
			id,
			name,
			account,
			parseInt(amount),
			category,
			subCategory,
			brand,
			store,
			type as "expense" | "income",
			new BudgetItemNextDate(new Date(nextDate), true),
			path,
			new FrequencyString(frequency),
			history
				?.filter((r) => !!r)
				.map((r) => {
					return BudgetItemRecord.fromString(
						id,
						r,
						type as "income" | "expense",
						toAccount
					);
				}) || []
		);
	}

	toMarkdown(): string {
		return `---
id: ${this._item.id}
name: ${this._item.name}
amount: ${this._item.amount.toNumber()}
category: ${this._item.category}
subCategory: ${this._item.subCategory || "To Assign"}
brand: ${this._item.brand}
store: ${this._item.store}
type: ${this._item.type}
nextDate: ${this._item.nextDate
			.toString()
			.split(" GMT")[0]
			.replace(" 00:00:00", "")}
${`\nfrequency: ${this._item.frequency}`}
${`\naccount: ${this._item.account}`}
${this._item.type === "transfer" ? `\nto account: ${this._item.account}` : ""}
---\n# History
${this._item.history.map((r) => r.toString()).join("\n")}`;
	}
}
