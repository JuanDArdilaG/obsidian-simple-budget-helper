import { describe, it, expect } from "vitest";
import { TransactionsReport } from "../../../../src/contexts/Reports/domain/transactions-report.entity";
import { buildTestTransactions } from "./buildTestTransactions";

describe("sortByDate", () => {
	it("should sort transactions by date in ascending order", () => {
		const transactions = buildTestTransactions([
			{ date: new Date(2024, 0, 15) },
			{ date: new Date(2024, 0, 12) },
			{ date: new Date(2024, 0, 23) },
			{ date: new Date(2024, 0, 15, 13) },
		]);
		const report = new TransactionsReport(transactions).sortedByDate("asc");

		expect(report.transactions.length).toBe(4);
		expect(report.transactions[0].date.getTime()).toBe(
			new Date(2024, 0, 12).getTime()
		);
		expect(report.transactions[1].date.getTime()).toBe(
			new Date(2024, 0, 15).getTime()
		);
		expect(report.transactions[2].date.getTime()).toBe(
			new Date(2024, 0, 15, 13).getTime()
		);
		expect(report.transactions[3].date.getTime()).toBe(
			new Date(2024, 0, 23).getTime()
		);
	});

	it("should sort transactions by date in descending order", () => {
		const transactions = buildTestTransactions([
			{ date: new Date(2024, 0, 15) },
			{ date: new Date(2024, 0, 12) },
			{ date: new Date(2024, 0, 23) },
			{ date: new Date(2024, 0, 15, 13) },
		]);
		const report = new TransactionsReport(transactions).sortedByDate(
			"desc"
		);

		expect(report.transactions.length).toBe(4);
		expect(report.transactions[0].date.getTime()).toBe(
			new Date(2024, 0, 23).getTime()
		);
		expect(report.transactions[1].date.getTime()).toBe(
			new Date(2024, 0, 15, 13).getTime()
		);
		expect(report.transactions[2].date.getTime()).toBe(
			new Date(2024, 0, 15).getTime()
		);
		expect(report.transactions[3].date.getTime()).toBe(
			new Date(2024, 0, 12).getTime()
		);
	});
});
