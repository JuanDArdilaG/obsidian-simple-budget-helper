import {
	DateValueObject,
	PriceValueObject,
	StringValueObject,
} from "@juandardilag/value-objects";
import { Category, CategoryID, CategoryName } from "contexts/Categories/domain";
import { ItemOperation } from "contexts/Shared/domain";
import { SubCategory, SubCategoryName } from "contexts/Subcategories/domain";
import { AccountSplit } from "contexts/Transactions/domain/account-split.valueobject";
import { TransactionAmount } from "contexts/Transactions/domain/transaction-amount.valueobject";
import { Account } from "../../../../src/contexts/Accounts/domain";
import {
	ItemRecurrenceFrequency,
	RecurrencePattern,
	ScheduledTransaction,
	ScheduledTransactionDate,
} from "../../../../src/contexts/ScheduledTransactions/domain";
import { TransactionCategory } from "../../../../src/contexts/Transactions/domain";
import { buildTestAccounts } from "../../Accounts/domain/buildTestAccounts";

type ItemConfig = {
	price?: PriceValueObject;
	account?: Account;
	toAccount?: Account;
	operation?: ItemOperation;
	recurrence?: {
		frequency?: string;
		startDate?: DateValueObject;
		untilDate?: DateValueObject;
	};
};

// Helper to create splits for test items
function makeSplits(account?: Account, amount: number = 100): AccountSplit[] {
	return account
		? [new AccountSplit(account, new TransactionAmount(Math.abs(amount)))]
		: [];
}

export const buildTestItems = (
	config: ItemConfig[] | number,
): ScheduledTransaction[] => {
	let items: ScheduledTransaction[] = [];
	if (typeof config === "number") {
		const accounts = buildTestAccounts(config);
		for (let i = 0; i < config; i++) {
			const fromSplits = makeSplits(accounts[i], 100);
			const toSplits: AccountSplit[] = [];
			const item = ScheduledTransaction.create(
				new StringValueObject("test"),
				RecurrencePattern.oneTime(
					ScheduledTransactionDate.createNowDate(),
				),
				fromSplits,
				toSplits,
				ItemOperation.expense(),
				new TransactionCategory(
					Category.create(new CategoryName("Test")),
					SubCategory.create(
						CategoryID.generate(),
						new SubCategoryName("Test"),
					),
				),
			);
			items.push(item);
		}
	} else {
		const accounts = buildTestAccounts(config.length * 2);
		items = config.map(
			({ price, operation, recurrence, account, toAccount }, index) => {
				const startDate = recurrence?.startDate
					? new ScheduledTransactionDate(recurrence.startDate)
					: ScheduledTransactionDate.createNowDate();
				const absPrice = price ? Math.abs(price.value) : 100;

				// Determine the accounts to use for splits
				const fromAccount = account || accounts[index];
				const toAccountForSplits =
					toAccount ||
					(operation?.type.isTransfer()
						? accounts[index + config.length]
						: undefined);

				const fromSplits = makeSplits(fromAccount, absPrice);
				const toSplits = makeSplits(toAccountForSplits, absPrice);

				// Ensure transfer operations have toSplits
				const finalToSplits =
					operation?.type.isTransfer() && toSplits.length === 0
						? makeSplits(accounts[index + config.length], absPrice)
						: toSplits;

				let item = ScheduledTransaction.create(
					new StringValueObject("test"),
					RecurrencePattern.oneTime(startDate),
					fromSplits,
					finalToSplits,
					operation ?? ItemOperation.expense(),
					new TransactionCategory(
						Category.create(new CategoryName("Test")),
						SubCategory.create(
							CategoryID.generate(),
							new SubCategoryName("Test"),
						),
					),
				);
				if (recurrence?.frequency) {
					item = ScheduledTransaction.create(
						new StringValueObject("test"),
						RecurrencePattern.infinite(
							startDate,
							new ItemRecurrenceFrequency(recurrence.frequency),
						),
						fromSplits,
						finalToSplits,
						operation ?? ItemOperation.expense(),
						new TransactionCategory(
							Category.create(new CategoryName("Test")),
							SubCategory.create(
								CategoryID.generate(),
								new SubCategoryName("Test"),
							),
						),
					);
					if (recurrence.untilDate) {
						const adjustedUntilDate =
							recurrence.untilDate.value <= startDate.value
								? new DateValueObject(
										new Date(
											startDate.value.getTime() +
												24 * 60 * 60 * 1000,
										),
									) // Add 1 day
								: recurrence.untilDate;

						item = ScheduledTransaction.create(
							new StringValueObject("test"),
							RecurrencePattern.untilDate(
								startDate,
								new ItemRecurrenceFrequency(
									recurrence.frequency,
								),
								adjustedUntilDate,
							),
							fromSplits,
							finalToSplits,
							operation ?? ItemOperation.expense(),
							new TransactionCategory(
								Category.create(new CategoryName("Test")),
								SubCategory.create(
									CategoryID.generate(),
									new SubCategoryName("Test"),
								),
							),
						);
					}
				}

				return item;
			},
		);
	}

	return items;
};
