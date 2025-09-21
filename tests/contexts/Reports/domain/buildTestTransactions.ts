import { DateValueObject } from "@juandardilag/value-objects";
import { AccountID } from "../../../../src/contexts/Accounts/domain/account-id.valueobject";
import { CategoryID } from "../../../../src/contexts/Categories/domain/category-id.valueobject";
import { OperationType } from "../../../../src/contexts/Shared/domain/value-objects/operation.valueobject";
import { SubCategoryID } from "../../../../src/contexts/Subcategories/domain/subcategory-id.valueobject";
import { TransactionName } from "../../../../src/contexts/Transactions/domain/item-name.valueobject";
import { PaymentSplit } from "../../../../src/contexts/Transactions/domain/payment-split.valueobject";
import { TransactionAmount } from "../../../../src/contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionDate } from "../../../../src/contexts/Transactions/domain/transaction-date.valueobject";
import { TransactionID } from "../../../../src/contexts/Transactions/domain/transaction-id.valueobject";
import { TransactionOperation } from "../../../../src/contexts/Transactions/domain/transaction-operation.valueobject";
import { Transaction } from "../../../../src/contexts/Transactions/domain/transaction.entity";

type TestBudgetSimpleConfig = {
	date?: Date;
	amount?: number;
	operation?: OperationType;
	account?: string;
	toAccount?: string;
	category?: string;
	subcategory?: string;
};

export const buildTestTransactions = (
	transactionsConfig: number | TestBudgetSimpleConfig[]
): Transaction[] => {
	const testTransactions: Transaction[] = [];
	if (transactionsConfig instanceof Array) {
		transactionsConfig.forEach(
			({
				date,
				amount,
				operation,
				account,
				toAccount,
				category,
				subcategory,
			}) => {
				const fromSplits = account
					? [
							new PaymentSplit(
								new AccountID(account),
								new TransactionAmount(amount ?? 100)
							),
					  ]
					: [];
				const toSplits = toAccount
					? [
							new PaymentSplit(
								new AccountID(toAccount),
								new TransactionAmount(amount ?? 100)
							),
					  ]
					: [];
				const transaction = new Transaction(
					TransactionID.generate(),
					fromSplits,
					toSplits,
					new TransactionName("test"),
					new TransactionOperation(operation ?? "expense"),
					category ? new CategoryID(category) : CategoryID.generate(),
					subcategory
						? new SubCategoryID(subcategory)
						: SubCategoryID.generate(),
					new TransactionDate(date ?? new Date()),
					DateValueObject.createNowDate()
				);
				testTransactions.push(transaction);
			}
		);
	} else {
		for (let i = 0; i < transactionsConfig; i++) {
			const fromSplits = [
				new PaymentSplit(
					AccountID.generate(),
					new TransactionAmount(100)
				),
			];
			const toSplits: PaymentSplit[] = [];
			const transaction = new Transaction(
				TransactionID.generate(),
				fromSplits,
				toSplits,
				new TransactionName("test"),
				TransactionOperation.expense(),
				CategoryID.generate(),
				SubCategoryID.generate(),
				new TransactionDate(new Date()),
				DateValueObject.createNowDate()
			);
			testTransactions.push(transaction);
		}
	}

	return testTransactions;
};
