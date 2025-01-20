import { BudgetItemNextDate } from "budget/BudgetItem/BudgetItemNextDate";
import { FrequencyString } from "budget/BudgetItem/FrequencyString";
import { BudgetItemRecurrentMDFormatter } from "./BudgetItemMDFormatter";
import { BudgetItemRecurrent } from "./BudgetItemRecurrent";

describe("toMarkdown", () => {
	it("should generate markdown correctly for recurrent item", () => {
		const item = BudgetItemRecurrent.create(
			"test",
			100,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2023-01-01")),
			new FrequencyString("1y"),
			""
		);
		const formatter = new BudgetItemRecurrentMDFormatter(item);

		expect(formatter.toMarkdown()).toBe(
			`---
name: test
amount: 100
category: test
type: income
nextDate: Sat Dec 31 2022
frequency: 1y
---
# History
`
		);
	});

	it("should generate markdown correctly for recurrent item with history", () => {
		const item = BudgetItemRecurrent.create(
			"test",
			100,
			"test",
			"income",
			new BudgetItemNextDate(new Date("2023-01-01")),
			new FrequencyString("1y"),
			""
		);
		item.record(new Date(2023, 0, 1, 13, 35), "account", 150);
		item.record(new Date(2024, 0, 3, 19, 12), "account", 100);
		const formatter = new BudgetItemRecurrentMDFormatter(item);

		const markdown = formatter.toMarkdown();

		expect(markdown).toBe(
			`---
name: test
amount: 100
category: test
type: income
nextDate: Sat Dec 31 2022
frequency: 1y
---
# History
- name: test. account: account. date: Sun Jan 01 2023 13:35:00. amount: $150
- name: test. account: account. date: Wed Jan 03 2024 19:12:00. amount: $100`
		);
	});
});
