import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { BudgetItemRecord } from "budget/BudgetItem/BudgetItemRecord";
import { FrequencyString } from "budget/BudgetItem/FrequencyString";
import { BudgetItem } from "./BudgetItem";

export class BudgetItemMDFormatter {
	constructor(private _item: BudgetItem) {}

	static fromRawMarkdown(path: string, rawMarkdown: string): BudgetItem {
		const propertiesRegex =
			/name: (.*)\namount: (.*)\ncategory: (.*)\ntype: (.*)\nnextDate: (.*)(?:\nfrequency: (.*))?/;
		const match = propertiesRegex.exec(rawMarkdown);
		if (!match) throw new Error("Invalid raw markdown.");
		const historyStr = rawMarkdown.split("# History\n");
		let history = undefined;
		if (historyStr[1]) {
			history = historyStr[1].split("\n");
		}

		return new BudgetItem(
			match[1],
			parseInt(match[2]),
			match[3],
			match[4] as "expense" | "income",
			new BudgetItemNextDate(new Date(match[5])),
			path,
			match[6] ? new FrequencyString(match[6]) : undefined,
			history
				?.filter((r) => !!r)
				.map((r) =>
					BudgetItemRecord.fromString(
						r,
						match[4] as "income" | "expense"
					)
				) || (match[6] ? [] : undefined)
		);
	}

	toMarkdown(): string {
		return `---
name: ${this._item.name}
amount: ${this._item.amount}
category: ${this._item.category}
type: ${this._item.type}
nextDate: ${this._item.nextDate
			.toString()
			.split(" GMT")[0]
			.replace(" 00:00:00", "")}${
			this._item.frequency ? `\nfrequency: ${this._item.frequency}` : ""
		}
---${!this._item.frequency ? "" : "\n# History"}
${
	this._item.frequency
		? this._item.history.map((r) => r.toString()).join("\n")
		: ""
}`;
	}
}
