import { describe, it, expect } from "vitest";
import { ReportsService } from "./reports.service";
import { TransactionsServiceMock } from "contexts/Transactions/domain/transactions-service.mock";
import { Transaction } from "contexts/Transactions/domain/transaction.entity";
import { TransactionID } from "contexts/Transactions/domain/transaction-id.valueobject";
import { ItemID } from "contexts/Items/domain/item-id.valueobject";
import { AccountID } from "contexts/Accounts/domain/account-id.valueobject";
import { TransactionName } from "contexts/Transactions/domain/item-name.valueobject";
import { TransactionOperation } from "contexts/Transactions/domain/transaction-operation.valueobject";
import { TransactionCategory } from "contexts/Transactions/domain/transaction-category.valueobject";
import { TransactionSubcategory } from "contexts/Transactions/domain/transaction-subcategory.valueobject";
import { TransactionDate } from "contexts/Transactions/domain/transaction-date.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { Criteria } from "contexts/Shared/domain/criteria";
import { OperationType } from "../../Shared/domain/value-objects/operation.valueobject";

describe("getTransactionsBalance", () => {
	it("should return the correct balance for one expense transaction", async () => {
		const transactions = buildTestTransactions({ transactions: 1 });
		let reportsService = new ReportsService(
			new TransactionsServiceMock(transactions)
		);
		const expectedBalance = -100;

		const balance = await reportsService.getTransactionsBalance(
			new Criteria()
		);

		expect(balance.valueOf()).toBe(expectedBalance);
	});

	it("should return the correct balance for three expense transactions", async () => {
		const transactions = buildTestTransactions({ transactions: 3 });
		let reportsService = new ReportsService(
			new TransactionsServiceMock(transactions)
		);
		const expectedBalance = -300;

		const balance = await reportsService.getTransactionsBalance(
			new Criteria()
		);

		expect(balance.valueOf()).toBe(expectedBalance);
	});

	it("should return the correct balance for income and expense transactions", async () => {
		const transactions = buildTestTransactions({
			transactions: [
				{ amount: 200 },
				{ amount: 600 },
				{ amount: 1700, operation: "income" },
			],
		});
		let reportsService = new ReportsService(
			new TransactionsServiceMock(transactions)
		);
		const expectedBalance = 900;

		const balance = await reportsService.getTransactionsBalance(
			new Criteria()
		);

		expect(balance.valueOf()).toBe(expectedBalance);
	});

	// it("should return the correct balance for income and expense transactions until date", async () => {
	// 	const transactions = buildTestTransactions({
	// 		transactions: [
	// 			{ date: new Date(2024, 0, 1) },
	// 			{ date: new Date(2024, 0, 3) },
	// 			{ date: new Date(2024, 0, 3) },
	// 			{ date: new Date(2024, 0, 5), operation: "income" },
	// 		],
	// 	});
	// 	let reportsService = new ReportsService(
	// 		new TransactionsServiceMock(transactions)
	// 	);
	// 	const untilDate = new Date(2024, 0, 3);
	// 	const untilDateCriteria = new TransactionCriteria().where(
	// 		"date",
	// 		untilDate,
	// 		"LESS_THAN_OR_EQUAL"
	// 	);

	// 	const balance = await reportsService.getTransactionsBalance(
	// 		untilDateCriteria
	// 	);

	// 	expect(balance.valueOf()).toBe(-300);
	// });
});

describe("getGroupedByYearMonthDay", () => {
	it("should group items by year, month, and day - 1 day", async () => {
		const transactions = buildTestTransactions({
			transactions: [{ date: new Date(2024, 0, 1) }],
		});
		let reportsService = new ReportsService(
			new TransactionsServiceMock(transactions)
		);

		const grouped = await reportsService.groupTransactionsByYearMonthDay();

		expect(Object.keys(grouped)).toEqual(["2024"]);
		expect(Object.keys(grouped[2024])).toEqual(["Jan"]);
		expect(Object.keys(grouped[2024]["Jan"])).toEqual(["1"]);
		expect(grouped[2024]["Jan"][1]).toEqual(transactions);
	});

	it("should group items by year, month, and day - multiple days", async () => {
		const transactions = buildTestTransactions({
			transactions: [
				{ date: new Date(2024, 0, 1) },
				{ date: new Date(2024, 0, 1) },
				{ date: new Date(2024, 0, 2) },
				{ date: new Date(2024, 0, 3) },
				{ date: new Date(2024, 0, 3) },
				{ date: new Date(2024, 0, 3) },
			],
		});
		let reportsService = new ReportsService(
			new TransactionsServiceMock(transactions)
		);

		const grouped = await reportsService.groupTransactionsByYearMonthDay();

		expect(Object.keys(grouped)).toEqual(["2024"]);
		expect(Object.keys(grouped[2024])).toEqual(["Jan"]);
		expect(Object.keys(grouped[2024]["Jan"])).toEqual(["1", "2", "3"]);
		expect(grouped[2024]["Jan"][1].length).toEqual(2);
		expect(grouped[2024]["Jan"][2].length).toEqual(1);
		expect(grouped[2024]["Jan"][3].length).toEqual(3);
	});

	// it("items in the same day should be sorted descending", async () => {
	// 	const transactions = buildTestTransactions({
	// 		transactions: [
	// 			{ date: new Date(2024, 0, 1, 17) },
	// 			{ date: new Date(2024, 0, 1, 2) },
	// 			{ date: new Date(2024, 0, 1, 22) },
	// 			{ date: new Date(2024, 0, 1, 4) },
	// 			{ date: new Date(2024, 0, 1, 5) },
	// 			{ date: new Date(2024, 0, 1, 1) },
	// 		],
	// 	});
	// 	let reportsService = new ReportsService(
	// 		new TransactionsServiceMock(transactions)
	// 	);

	// 	const grouped = await reportsService.groupTransactionsByYearMonthDay();

	// 	expect(Object.keys(grouped)).toEqual(["2024"]);
	// 	expect(Object.keys(grouped[2024])).toEqual(["Jan"]);
	// 	expect(Object.keys(grouped[2024]["Jan"])).toEqual(["1"]);
	// 	expect(grouped[2024]["Jan"][1].length).toEqual(6);
	// 	expect(grouped[2024]["Jan"][1][0].date.valueOf().getHours()).toEqual(
	// 		22
	// 	);
	// 	expect(grouped[2024]["Jan"][1][1].date.valueOf().getHours()).toEqual(
	// 		17
	// 	);
	// 	expect(grouped[2024]["Jan"][1][2].date.valueOf().getHours()).toEqual(5);
	// 	expect(grouped[2024]["Jan"][1][3].date.valueOf().getHours()).toEqual(4);
	// 	expect(grouped[2024]["Jan"][1][4].date.valueOf().getHours()).toEqual(2);
	// 	expect(grouped[2024]["Jan"][1][5].date.valueOf().getHours()).toEqual(1);
	// });
});

type TestBudgetConfig = {
	transactions: number | TestBudgetSimpleConfig[];
};

type TestBudgetSimpleConfig = {
	date?: Date;
	amount?: number;
	operation?: OperationType;
};

export const buildTestTransactions = ({
	transactions,
}: TestBudgetConfig): Transaction[] => {
	const testTransactions: Transaction[] = [];
	if (transactions instanceof Array) {
		transactions.forEach((transactionConfig) => {
			const transaction = new Transaction(
				TransactionID.generate(),
				ItemID.generate(),
				AccountID.generate(),
				new TransactionName("test"),
				new TransactionOperation(
					transactionConfig.operation ?? "expense"
				),
				new TransactionCategory("test"),
				new TransactionSubcategory("test"),
				new TransactionDate(transactionConfig.date ?? new Date()),
				new TransactionAmount(transactionConfig.amount ?? 100)
			);
			testTransactions.push(transaction);
		});
	} else {
		for (let i = 0; i < transactions; i++) {
			const transaction = new Transaction(
				TransactionID.generate(),
				ItemID.generate(),
				AccountID.generate(),
				new TransactionName("test"),
				TransactionOperation.expense(),
				new TransactionCategory("test"),
				new TransactionSubcategory("test"),
				new TransactionDate(new Date()),
				new TransactionAmount(100)
			);
			testTransactions.push(transaction);
		}
	}

	return testTransactions;
};
