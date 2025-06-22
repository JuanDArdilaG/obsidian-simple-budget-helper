import { describe, expect, it } from "vitest";
import {
	Account,
	AccountType,
	AccountID,
	AccountBalance,
	AccountName,
} from "../../../../src/contexts/Accounts/domain";
import { buildTestTransactions } from "../../Reports/domain/buildTestTransactions";
import { DateValueObject, PriceValueObject } from "@juandardilag/value-objects";

describe("adjustOnTransactionDeletion", () => {
	it("account balance should be adjust on expense transaction", () => {
		const account = buildTestAccount();
		const transactions = buildTestTransactions([{ amount: 100 }]);

		account.adjustOnTransactionDeletion(transactions[0]);

		expect(account.balance.value.value).toBe(100);
	});

	it("account balance should be adjust on income transaction", () => {
		const account = buildTestAccount();
		const transactions = buildTestTransactions([
			{ amount: 100, operation: "income" },
		]);

		account.adjustOnTransactionDeletion(transactions[0]);

		expect(account.balance.value.value).toBe(-100);
	});

	it("account balance should be adjust on transfer transaction - account", () => {
		const account = buildTestAccount();
		const transactions = buildTestTransactions([
			{ amount: 100, operation: "transfer", account: account.id.value },
		]);

		account.adjustOnTransactionDeletion(transactions[0]);

		expect(account.balance.value.value).toBe(100);
	});

	it("account balance should be adjust on transfer transaction - toAccount", () => {
		const account = buildTestAccount();
		const transactions = buildTestTransactions([
			{ amount: 100, operation: "transfer", toAccount: account.id.value },
		]);

		account.adjustOnTransactionDeletion(transactions[0]);

		expect(account.balance.value.value).toBe(-100);
	});
});

const buildTestAccount = (): Account => {
	return new Account(
		AccountID.generate(),
		AccountType.asset(),
		new AccountName("name"),
		new AccountBalance(PriceValueObject.zero()),
		DateValueObject.createNowDate()
	);
};
