import { ItemOperation } from "contexts/Shared/domain";
import { describe, expect, it } from "vitest";

describe("is", () => {
	it("isTransfer", () => {
		const operation = new ItemOperation("transfer");

		const isTransfer = operation.isTransfer();

		expect(isTransfer).toBeTruthy();
	});

	it("isExpense", () => {
		const operation = new ItemOperation("expense");

		const isExpense = operation.isExpense();

		expect(isExpense).toBeTruthy();
	});

	it("isIncome", () => {
		const operation = new ItemOperation("income");

		const isIncome = operation.isIncome();

		expect(isIncome).toBeTruthy();
	});
});
