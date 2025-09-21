import { ItemOperation } from "contexts/Shared/domain";
import { describe, expect, it } from "vitest";

describe("is", () => {
	it("isTransfer", () => {
		const operation = ItemOperation.transfer();

		const isTransfer = operation.type.isTransfer();

		expect(isTransfer).toBeTruthy();
	});

	it("isExpense", () => {
		const operation = ItemOperation.expense();

		const isExpense = operation.type.isExpense();

		expect(isExpense).toBeTruthy();
	});

	it("isIncome", () => {
		const operation = ItemOperation.income();

		const isIncome = operation.type.isIncome();

		expect(isIncome).toBeTruthy();
	});
});

describe("ItemOperation", () => {
	it("should create a transfer operation", () => {
		const operation = ItemOperation.transfer();
		expect(operation.type.value).toBe("transfer");
	});

	it("should create an expense operation", () => {
		const operation = ItemOperation.expense();
		expect(operation.type.value).toBe("expense");
	});

	it("should create an income operation", () => {
		const operation = ItemOperation.income();
		expect(operation.type.value).toBe("income");
	});
});
