import { OperationType } from "../../../../src/contexts/Shared/domain/value-objects/operation.valueobject";
import { AccountID } from "../../../../src/contexts/Accounts/domain/account-id.valueobject";
import { Transaction } from "../../../../src/contexts/Transactions/domain/transaction.entity";
import { TransactionName } from "../../../../src/contexts/Transactions/domain/item-name.valueobject";
import { TransactionAmount } from "../../../../src/contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionDate } from "../../../../src/contexts/Transactions/domain/transaction-date.valueobject";
import { TransactionID } from "../../../../src/contexts/Transactions/domain/transaction-id.valueobject";
import { TransactionOperation } from "../../../../src/contexts/Transactions/domain/transaction-operation.valueobject";
import { SubcategoryID } from "../../../../src/contexts/Subcategories/domain/subcategory-id.valueobject";
import { CategoryID } from "../../../../src/contexts/Categories/domain/category-id.valueobject";

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
				AccountID.generate(),
				new TransactionName("test"),
				new TransactionOperation(
					transactionConfig.operation ?? "expense"
				),
				CategoryID.generate(),
				SubcategoryID.generate(),
				new TransactionDate(transactionConfig.date ?? new Date()),
				new TransactionAmount(transactionConfig.amount ?? 100)
			);
			testTransactions.push(transaction);
		});
	} else {
		for (let i = 0; i < transactions; i++) {
			const transaction = new Transaction(
				TransactionID.generate(),
				AccountID.generate(),
				new TransactionName("test"),
				TransactionOperation.expense(),
				CategoryID.generate(),
				SubcategoryID.generate(),
				new TransactionDate(new Date()),
				new TransactionAmount(100)
			);
			testTransactions.push(transaction);
		}
	}

	return testTransactions;
};
