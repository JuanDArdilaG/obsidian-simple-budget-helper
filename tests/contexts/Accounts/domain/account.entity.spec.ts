import { DateValueObject, PriceValueObject } from "@juandardilag/value-objects";
import { describe, expect, it } from "vitest";
import {
	Account,
	AccountAssetSubtype,
	AccountBalance,
	AccountLiabilitySubtype,
	AccountName,
	AccountType,
} from "../../../../src/contexts/Accounts/domain";
import { Currency } from "../../../../src/contexts/Currencies/domain/currency.vo";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { buildTestTransactions } from "../../Reports/domain/buildTestTransactions";

describe("adjustOnTransactionDeletion", () => {
	it("account balance should be adjust on expense transaction", () => {
		const account = buildTestAccount();
		const transactions = buildTestTransactions([{ account, amount: 100 }]);

		account.adjustOnTransactionDeletion(transactions[0]);

		expect(account.balance.value.value).toBe(100);
	});

	it("account balance should be adjust on income transaction", () => {
		const account = buildTestAccount();
		const transactions = buildTestTransactions([
			{ account, amount: 100, operation: "income" },
		]);

		account.adjustOnTransactionDeletion(transactions[0]);

		expect(account.balance.value.value).toBe(-100);
	});

	it("account balance should be adjust on transfer transaction - account", () => {
		const account = buildTestAccount();
		const toAccount = buildTestAccount();
		const transactions = buildTestTransactions([
			{
				account,
				amount: 100,
				operation: "transfer",
				toAccount,
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
				account,
				amount: 100,
				operation: "transfer",
				toAccount,
			},
		]);

		toAccount.adjustOnTransactionDeletion(transactions[0]);

		expect(toAccount.balance.value.value).toBe(-100);
	});
});

describe("adjustFromTransaction with liability accounts", () => {
	it("liability account balance should decrease on income transaction (reduces debt)", () => {
		const liabilityAccount = buildTestLiabilityAccount();
		const transactions = buildTestTransactions([
			{
				account: liabilityAccount,
				amount: 100,
				operation: "income",
			},
		]);

		liabilityAccount.adjustFromTransaction(transactions[0]);

		// For liability accounts, income should reduce the debt (negative balance becomes less negative)
		expect(liabilityAccount.balance.value.value).toBe(-100);
	});

	it("liability account balance should increase on expense transaction (increases debt)", () => {
		const liabilityAccount = buildTestLiabilityAccount();
		const transactions = buildTestTransactions([
			{
				account: liabilityAccount,
				amount: 100,
				operation: "expense",
			},
		]);

		liabilityAccount.adjustFromTransaction(transactions[0]);

		// For liability accounts, expense should increase the debt (negative balance becomes more negative)
		expect(liabilityAccount.balance.value.value).toBe(100);
	});

	it("asset account balance should increase on income transaction", () => {
		const assetAccount = buildTestAccount();
		const transactions = buildTestTransactions([
			{
				account: assetAccount,
				amount: 100,
				operation: "income",
			},
		]);

		assetAccount.adjustFromTransaction(transactions[0]);

		// For asset accounts, income should increase the balance
		expect(assetAccount.balance.value.value).toBe(100);
	});

	it("asset account balance should decrease on expense transaction", () => {
		const assetAccount = buildTestAccount();
		const transactions = buildTestTransactions([
			{
				account: assetAccount,
				amount: 100,
				operation: "expense",
			},
		]);

		assetAccount.adjustFromTransaction(transactions[0]);

		// For asset accounts, expense should decrease the balance
		expect(assetAccount.balance.value.value).toBe(-100);
	});
});

const buildTestAccount = (): Account => {
	return new Account(
		Nanoid.generate(),
		AccountType.asset(),
		AccountAssetSubtype.CHECKING,
		new AccountName("name"),
		new Currency("USD"),
		new AccountBalance(PriceValueObject.zero()),
		DateValueObject.createNowDate(),
	);
};

const buildTestLiabilityAccount = (): Account => {
	return new Account(
		Nanoid.generate(),
		AccountType.liability(),
		AccountLiabilitySubtype.CREDIT_CARD,
		new AccountName("Liability Account"),
		new Currency("USD"),
		new AccountBalance(PriceValueObject.zero()),
		DateValueObject.createNowDate(),
	);
};
