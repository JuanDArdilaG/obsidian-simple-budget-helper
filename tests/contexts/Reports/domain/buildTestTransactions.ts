import { DateValueObject } from "@juandardilag/value-objects";
import { Account } from "../../../../src/contexts/Accounts/domain";
import {
	Category,
	CategoryName,
} from "../../../../src/contexts/Categories/domain";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { OperationType } from "../../../../src/contexts/Shared/domain/value-objects/operation.valueobject";
import {
	SubCategory,
	SubCategoryName,
} from "../../../../src/contexts/Subcategories/domain";
import { AccountSplit } from "../../../../src/contexts/Transactions/domain/account-split.valueobject";
import { TransactionName } from "../../../../src/contexts/Transactions/domain/item-name.valueobject";
import { TransactionAmount } from "../../../../src/contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionDate } from "../../../../src/contexts/Transactions/domain/transaction-date.valueobject";
import { TransactionOperation } from "../../../../src/contexts/Transactions/domain/transaction-operation.valueobject";
import { Transaction } from "../../../../src/contexts/Transactions/domain/transaction.entity";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

type TestBudgetSimpleConfig = {
	date?: Date;
	amount?: number;
	operation?: OperationType;
	account?: Account;
	toAccount?: Account;
	category?: string;
	subcategory?: string;
};

export const buildTestTransactions = (
	transactionsConfig: number | TestBudgetSimpleConfig[],
): Transaction[] => {
	const testTransactions: Transaction[] = [];
	if (Array.isArray(transactionsConfig)) {
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
							new AccountSplit(
								account,
								new TransactionAmount(amount ?? 100),
							),
						]
					: [];
				const toSplits = toAccount
					? [
							new AccountSplit(
								toAccount,
								new TransactionAmount(amount ?? 100),
							),
						]
					: [];
				const _category = category
					? new Category(
							new Nanoid(category),
							new CategoryName(category),
							DateValueObject.createNowDate(),
						)
					: Category.create(new CategoryName("Default"));
				const transaction = new Transaction(
					Nanoid.generate(),
					fromSplits,
					toSplits,
					new TransactionName("test"),
					new TransactionOperation(operation ?? "expense"),
					_category,
					subcategory
						? new SubCategory(
								new Nanoid(subcategory),
								_category.id,
								new SubCategoryName(subcategory),
								DateValueObject.createNowDate(),
							)
						: SubCategory.create(
								_category.id,
								new SubCategoryName("Default"),
							),
					new TransactionDate(date ?? new Date()),
					DateValueObject.createNowDate(),
				);
				testTransactions.push(transaction);
			},
		);
	} else {
		const accounts = buildTestAccounts(transactionsConfig);
		for (let i = 0; i < transactionsConfig; i++) {
			const fromSplits = [
				new AccountSplit(accounts[i], new TransactionAmount(100)),
			];
			const toSplits: AccountSplit[] = [];
			const category = Category.create(new CategoryName("Test"));
			const transaction = new Transaction(
				Nanoid.generate(),
				fromSplits,
				toSplits,
				new TransactionName("test"),
				TransactionOperation.expense(),
				category,
				SubCategory.create(category.id, new SubCategoryName("Test")),
				new TransactionDate(new Date()),
				DateValueObject.createNowDate(),
			);
			testTransactions.push(transaction);
		}
	}

	return testTransactions;
};
