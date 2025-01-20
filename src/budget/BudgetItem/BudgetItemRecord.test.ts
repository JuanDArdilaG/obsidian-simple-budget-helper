import { BudgetItemRecord } from "./BudgetItemRecord";

describe("toString", () => {
	it("should return a string representation of the BudgetItemRecord", () => {
		const record = new BudgetItemRecord(
			"0",
			"0",
			"account",
			"",
			"Test",
			"expense",
			new Date(2024, 0, 1, 15, 35),
			100
		);

		const str = record.toString();

		expect(str).toBe(
			`- id: 0. name: Test. account: account. date: Mon Jan 01 2024 15:35:00. amount: $100`
		);
	});
});
