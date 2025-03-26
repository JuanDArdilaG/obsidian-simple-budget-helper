import { OperationType } from "../../../../src/contexts/Shared/domain/value-objects/operation.valueobject";
import { AccountID } from "../../../../src/contexts/Accounts/domain/account-id.valueobject";
import { Transaction } from "../../../../src/contexts/Transactions/domain/transaction.entity";
import { TransactionName } from "../../../../src/contexts/Transactions/domain/item-name.valueobject";
import { TransactionAmount } from "../../../../src/contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionDate } from "../../../../src/contexts/Transactions/domain/transaction-date.valueobject";
import { TransactionID } from "../../../../src/contexts/Transactions/domain/transaction-id.valueobject";
import { TransactionOperation } from "../../../../src/contexts/Transactions/domain/transaction-operation.valueobject";
import { SubCategoryID } from "../../../../src/contexts/Subcategories/domain/subcategory-id.valueobject";
import { CategoryID } from "../../../../src/contexts/Categories/domain/category-id.valueobject";

type TestBudgetSimpleConfig = {
	date?: Date;
	amount?: number;
	operation?: OperationType;
	account?: string;
	toAccount?: string;
};

export const buildTestTransactions = (
	transactionsConfig: number | TestBudgetSimpleConfig[]
): Transaction[] => {
	const testTransactions: Transaction[] = [];
	if (transactionsConfig instanceof Array) {
		transactionsConfig.forEach(
			({ date, amount, operation, account, toAccount }) => {
				const transaction = new Transaction(
					TransactionID.generate(),
					account ? new AccountID(account) : AccountID.generate(),
					new TransactionName("test"),
					new TransactionOperation(operation ?? "expense"),
					CategoryID.generate(),
					SubCategoryID.generate(),
					new TransactionDate(date ?? new Date()),
					new TransactionAmount(amount ?? 100),
					undefined,
					toAccount ? new AccountID(toAccount) : undefined
				);
				testTransactions.push(transaction);
			}
		);
	} else {
		for (let i = 0; i < transactionsConfig; i++) {
			const transaction = new Transaction(
				TransactionID.generate(),
				AccountID.generate(),
				new TransactionName("test"),
				TransactionOperation.expense(),
				CategoryID.generate(),
				SubCategoryID.generate(),
				new TransactionDate(new Date()),
				new TransactionAmount(100)
			);
			testTransactions.push(transaction);
		}
	}

	return testTransactions;
};
