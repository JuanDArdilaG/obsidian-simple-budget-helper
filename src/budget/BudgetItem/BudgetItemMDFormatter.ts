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
			/id: (.*)\nname: (.*)\namount: (.*)\ncategory: (.*)\ntype: (.*)\nnextDate: (.*)\nfrequency: (.*)\naccount: (.*)(?:\nto account: (.*))?/;
		const match = propertiesRegex.exec(rawMarkdown);
		if (!match) throw new Error("Invalid raw markdown.");
		const historyStr = rawMarkdown.split("# History\n");
		let history = undefined;
		if (historyStr[1]) {
			history = historyStr[1].split("\n");
		}

		return new BudgetItemRecurrent(
			match[1],
			match[2],
			match[8],
			parseInt(match[3]),
			match[4],
			match[5] as "expense" | "income",
			new BudgetItemNextDate(new Date(match[6])),
			path,
			new FrequencyString(match[7]),
			history
				?.filter((r) => !!r)
				.map((r, i) => {
					return BudgetItemRecord.fromString(
						match[1],
						r,
						match[5] as "income" | "expense",
						match[8] ? match[8] : undefined
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
type: ${this._item.type}
nextDate: ${this._item.nextDate
			.toString()
			.split(" GMT")[0]
			.replace(
				" 00:00:00",
				""
			)}${`\nfrequency: ${this._item.frequency}`}${`\naccount: ${this._item.account}`}
---\n# History
${this._item.history.map((r) => r.toString()).join("\n")}`;
	}
}
