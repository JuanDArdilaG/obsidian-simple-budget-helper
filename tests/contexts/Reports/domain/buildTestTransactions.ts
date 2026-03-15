import { DateValueObject } from "@juandardilag/value-objects";
import { Account } from "../../../../src/contexts/Accounts/domain";
import {
	Category,
	CategoryName,
} from "../../../../src/contexts/Categories/domain";
import { Nanoid } from "../../../../src/contexts/Shared/domain";
import { OperationType } from "../../../../src/contexts/Shared/domain/value-objects/operation.valueobject";
import { PriceVO } from "../../../../src/contexts/Shared/domain/value-objects/price.vo";
import {
	Subcategory,
	SubcategoryName,
} from "../../../../src/contexts/Subcategories/domain";
import { AccountSplit } from "../../../../src/contexts/Transactions/domain/account-split.valueobject";
import { TransactionName } from "../../../../src/contexts/Transactions/domain/item-name.valueobject";
import { TransactionAmount } from "../../../../src/contexts/Transactions/domain/transaction-amount.valueobject";
import { TransactionDate } from "../../../../src/contexts/Transactions/domain/transaction-date.valueobject";
import { TransactionItem } from "../../../../src/contexts/Transactions/domain/transaction-item.entity";
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
								account.nanoid,
								new TransactionAmount(amount ?? 100),
							),
						]
					: [];
				const toSplits = toAccount
					? [
							new AccountSplit(
								toAccount.nanoid,
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
				const _subcategory = subcategory
					? new Subcategory(
							new Nanoid(subcategory),
							_category.nanoid,
							new SubcategoryName(subcategory),
							new Date(),
						)
					: Subcategory.create(
							_category.nanoid,
							new SubcategoryName("Default"),
						);
				const transactionItems = [
					new TransactionItem(
						new TransactionName("test"),
						new PriceVO(amount ?? 100),
						1,
						_category.nanoid,
						_subcategory.nanoid,
					),
				];
				const transaction = new Transaction(
					Nanoid.generate(),
					fromSplits,
					toSplits,
					new TransactionOperation(operation ?? "expense"),
					new TransactionDate(date ?? new Date()),
					transactionItems,
					DateValueObject.createNowDate(),
				);
				testTransactions.push(transaction);
			},
		);
	} else {
		const accounts = buildTestAccounts(transactionsConfig);
		for (let i = 0; i < transactionsConfig; i++) {
			const fromSplits = [
				new AccountSplit(
					accounts[i].nanoid,
					new TransactionAmount(100),
				),
			];
			const toSplits: AccountSplit[] = [];
			const category = Category.create(new CategoryName("Test"));
			const subcategory = Subcategory.create(
				category.nanoid,
				new SubcategoryName("Test"),
			);
			const transactionItems = [
				new TransactionItem(
					new TransactionName("test"),
					new PriceVO(100),
					1,
					category.nanoid,
					subcategory.nanoid,
				),
			];
			const transaction = new Transaction(
				Nanoid.generate(),
				fromSplits,
				toSplits,
				TransactionOperation.expense(),
				new TransactionDate(new Date()),
				transactionItems,
				DateValueObject.createNowDate(),
			);
			testTransactions.push(transaction);
		}
	}

	return testTransactions;
};
