import { DateValueObject, PriceValueObject } from "@juandardilag/value-objects";
import { describe, expect, it } from "vitest";
import {
	Account,
	AccountBalance,
	AccountID,
	AccountName,
	AccountType,
} from "../../../../src/contexts/Accounts/domain";
import { buildTestTransactions } from "../../Reports/domain/buildTestTransactions";

describe("adjustOnTransactionDeletion", () => {
	it("account balance should be adjust on expense transaction", () => {
		const account = buildTestAccount();
		const transactions = buildTestTransactions([
			{ account: account.id.value, amount: 100 },
		]);

		account.adjustOnTransactionDeletion(transactions[0]);

		expect(account.balance.value.value).toBe(100);
	});

	it("account balance should be adjust on income transaction", () => {
		const account = buildTestAccount();
		const transactions = buildTestTransactions([
			{ account: account.id.value, amount: 100, operation: "income" },
		]);

		account.adjustOnTransactionDeletion(transactions[0]);

		expect(account.balance.value.value).toBe(-100);
	});

	it("account balance should be adjust on transfer transaction - account", () => {
		const account = buildTestAccount();
		const toAccount = buildTestAccount();
		const transactions = buildTestTransactions([
			{
				account: account.id.value,
				amount: 100,
				operation: "transfer",
				toAccount: toAccount.id.value,
			},
		]);

		account.adjustOnTransactionDeletion(transactions[0]);

		expect(account.balance.value.value).toBe(100);
	});

	it("account balance should be adjust on transfer transaction - toAccount", () => {
		const account = buildTestAccount();
		const toAccount = buildTestAccount();
		const transactions = buildTestTransactions([
			{
				account: account.id.value,
				amount: 100,
				operation: "transfer",
				toAccount: toAccount.id.value,
			},
		]);

		toAccount.adjustOnTransactionDeletion(transactions[0]);

		expect(toAccount.balance.value.value).toBe(-100);
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
