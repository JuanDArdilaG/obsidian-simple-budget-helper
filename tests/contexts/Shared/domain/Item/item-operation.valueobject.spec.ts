import { AccountID } from "contexts/Accounts/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { describe, expect, it } from "vitest";

describe("is", () => {
	it("isTransfer", () => {
		const operation = ItemOperation.transfer(
			AccountID.generate(),
			AccountID.generate()
		);

		const isTransfer = operation.type.isTransfer();

		expect(isTransfer).toBeTruthy();
	});

	it("isExpense", () => {
		const operation = ItemOperation.expense(AccountID.generate());

		const isExpense = operation.type.isExpense();

		expect(isExpense).toBeTruthy();
	});

	it("isIncome", () => {
		const operation = ItemOperation.income(AccountID.generate());

		const isIncome = operation.type.isIncome();

		expect(isIncome).toBeTruthy();
	});
});
