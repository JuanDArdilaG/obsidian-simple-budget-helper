import { describe, expect, it } from "vitest";
import { AccountsMap } from "../../../../src/contexts/Accounts/application/get-all-accounts.usecase";
import { TransactionsReport } from "../../../../src/contexts/Reports/domain/transactions-report.entity";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";
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
			new Date(2024, 0, 12).getTime(),
		);
		expect(report.transactions[1].date.getTime()).toBe(
			new Date(2024, 0, 15).getTime(),
		);
		expect(report.transactions[2].date.getTime()).toBe(
			new Date(2024, 0, 15, 13).getTime(),
		);
		expect(report.transactions[3].date.getTime()).toBe(
			new Date(2024, 0, 23).getTime(),
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
			"desc",
		);

		expect(report.transactions.length).toBe(4);
		expect(report.transactions[0].date.getTime()).toBe(
			new Date(2024, 0, 23).getTime(),
		);
		expect(report.transactions[1].date.getTime()).toBe(
			new Date(2024, 0, 15, 13).getTime(),
		);
		expect(report.transactions[2].date.getTime()).toBe(
			new Date(2024, 0, 15).getTime(),
		);
		expect(report.transactions[3].date.getTime()).toBe(
			new Date(2024, 0, 12).getTime(),
		);
	});
});

describe("withAccumulatedBalance", () => {
	it("should populate destinationAccounts for transfer transactions", () => {
		// Create two test accounts
		const accounts = buildTestAccounts(2);
		const fromAccount = accounts[0];
		const toAccount = accounts[1];

		// Create an AccountsMap
		const accountsMap: AccountsMap = new Map([
			[fromAccount.id, fromAccount],
			[toAccount.id, toAccount],
		]);

		// Create a transfer transaction
		const transactions = buildTestTransactions([
			{
				date: new Date(2024, 0, 15),
				amount: 100,
				operation: "transfer",
				account: fromAccount,
				toAccount: toAccount,
			},
		]);

		const report = new TransactionsReport(transactions);
		const result = report.withAccumulatedBalance(accountsMap);

		// Verify the result
		expect(result.length).toBe(1);
		const transactionWithBalance = result[0];

		// Verify it's a transfer
		expect(transactionWithBalance.transaction.operation.isTransfer()).toBe(
			true,
		);

		// Check that originAccounts are populated
		expect(transactionWithBalance.originAccounts).toBeDefined();
		expect(transactionWithBalance.originAccounts.length).toBe(1);
		expect(transactionWithBalance.originAccounts[0].account.id).toBe(
			fromAccount.id,
		);
		// Origin account should have -100 balance (money going out)
		expect(transactionWithBalance.originAccounts[0].balance).toBe(-100);
		expect(transactionWithBalance.originAccounts[0].prevBalance).toBe(0);

		// Check that destinationAccounts are populated (this should fail if bug exists)
		expect(transactionWithBalance.destinationAccounts).toBeDefined();
		expect(transactionWithBalance.destinationAccounts?.length).toBe(1);
		expect(transactionWithBalance.destinationAccounts?.[0].account.id).toBe(
			toAccount.id,
		);
		// Destination account should have +100 balance (money coming in)
		expect(transactionWithBalance.destinationAccounts?.[0].balance).toBe(
			100,
		);
		expect(
			transactionWithBalance.destinationAccounts?.[0].prevBalance,
		).toBe(0);
	});

	it("should handle mixed transactions with transfers correctly", () => {
		// Create three test accounts
		const accounts = buildTestAccounts(3);
		const checkingAccount = accounts[0];
		const savingsAccount = accounts[1];
		const creditCard = accounts[2];

		// Create an AccountsMap
		const accountsMap: AccountsMap = new Map([
			[checkingAccount.id, checkingAccount],
			[savingsAccount.id, savingsAccount],
			[creditCard.id, creditCard],
		]);

		// Create multiple transactions: expense, transfer, income
		const transactions = buildTestTransactions([
			{
				date: new Date(2024, 0, 10),
				amount: 50,
				operation: "expense",
				account: checkingAccount,
			},
			{
				date: new Date(2024, 0, 15),
				amount: 100,
				operation: "transfer",
				account: checkingAccount,
				toAccount: savingsAccount,
			},
			{
				date: new Date(2024, 0, 20),
				amount: 200,
				operation: "income",
				account: checkingAccount,
			},
		]);

		const report = new TransactionsReport(transactions);
		const result = report.withAccumulatedBalance(accountsMap);

		expect(result.length).toBe(3);

		// Check the transfer transaction (should be at index 1 when sorted by date desc)
		const transferTransaction = result.find((t) =>
			t.transaction.operation.isTransfer(),
		);
		expect(transferTransaction).toBeDefined();

		// Verify destinationAccounts are populated for the transfer
		expect(transferTransaction?.destinationAccounts).toBeDefined();
		expect(transferTransaction?.destinationAccounts?.length).toBe(1);
		expect(transferTransaction?.destinationAccounts?.[0].account.id).toBe(
			savingsAccount.id,
		);

		// Verify non-transfer transactions have empty or no destinationAccounts
		const expenseTransaction = result.find((t) =>
			t.transaction.operation.isExpense(),
		);
		expect(expenseTransaction?.destinationAccounts?.length).toBe(0);
	});

	it("should accumulate balances correctly for multiple transfers to the same destination account", () => {
		// Create accounts
		const accounts = buildTestAccounts(3);
		const checking = accounts[0];
		const savings = accounts[1];
		const wallet = accounts[2];

		const accountsMap: AccountsMap = new Map([
			[checking.id, checking],
			[savings.id, savings],
			[wallet.id, wallet],
		]);

		// Create multiple transfers to the same destination account
		const transactions = buildTestTransactions([
			{
				date: new Date(2024, 0, 10),
				amount: 50,
				operation: "transfer",
				account: checking,
				toAccount: savings,
			},
			{
				date: new Date(2024, 0, 15),
				amount: 100,
				operation: "transfer",
				account: wallet,
				toAccount: savings,
			},
			{
				date: new Date(2024, 0, 20),
				amount: 75,
				operation: "transfer",
				account: checking,
				toAccount: savings,
			},
		]);

		const report = new TransactionsReport(transactions);
		const result = report.withAccumulatedBalance(accountsMap);

		expect(result.length).toBe(3);

		// Results are in descending order (reversed), so:
		// result[0] is the last transaction (Jan 20)
		// result[1] is the middle transaction (Jan 15)
		// result[2] is the first transaction (Jan 10)

		// Check the last transfer (Jan 20) - should be first in reversed array
		const lastTransfer = result[0];
		expect(lastTransfer.transaction.operation.isTransfer()).toBe(true);

		// Destination account (savings) should show accumulated balance
		expect(lastTransfer.destinationAccounts).toBeDefined();
		expect(lastTransfer.destinationAccounts?.length).toBe(1);
		const savingsDestInfo = lastTransfer.destinationAccounts?.find(
			(d) => d.account.id === savings.id,
		);
		expect(savingsDestInfo).toBeDefined();
		// After 3 transfers: +50, +100, +75 = +225
		expect(savingsDestInfo?.balance).toBe(225);
		// Previous balance should be 150 (after first two transfers)
		expect(savingsDestInfo?.prevBalance).toBe(150);
	});

	it("should NOT populate destinationAccounts for non-transfer transactions", () => {
		const accounts = buildTestAccounts(1);
		const account = accounts[0];

		const accountsMap: AccountsMap = new Map([[account.id, account]]);

		// Create an expense transaction (not a transfer)
		const transactions = buildTestTransactions([
			{
				date: new Date(2024, 0, 15),
				amount: 100,
				operation: "expense",
				account: account,
			},
		]);

		const report = new TransactionsReport(transactions);
		const result = report.withAccumulatedBalance(accountsMap);

		expect(result.length).toBe(1);
		const transactionWithBalance = result[0];

		// Origin accounts should be populated
		expect(transactionWithBalance.originAccounts).toBeDefined();
		expect(transactionWithBalance.originAccounts.length).toBe(1);

		// Destination accounts should be empty array for non-transfers, not undefined
		// This test checks the actual behavior
		expect(transactionWithBalance.destinationAccounts).toBeDefined();
		expect(transactionWithBalance.destinationAccounts?.length).toBe(0);
	});
});
